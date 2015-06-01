var GitHubAPI = Meteor.npmRequire("github");
var github = new GitHubAPI({
   version: "3.0.0",
   debug: true
});

var wrappedRepos = Async.wrap(github.repos, [
   'getAll',
   'getCollaborators',
   'getFromUser',
   'getHooks'
]);

var wrappedIssues = Async.wrap(github.issues, [
   'create',
   'createComment',
   'edit',
   'getAllMilestones',
   'getComments',
   'repoIssues'
]);


LocalRepos = new Mongo.Collection("localRepos");

var authenticateUser = function () {
   github.authenticate({
      type: "oauth",
      token: Meteor.user().services.github.accessToken
   });
};

var getGitHubUsername = function () {
   return Meteor.user().services.github.username;
};

function pruneEmpties(obj, keysToCheck) {
   keysToCheck.forEach(function (key) {
      if (!obj[key]) {
         delete obj[key];
      }
   });
}

function localIssuesMap(username, reponame) {
   var localIssues = LocalRepos.find({reponame: reponame, username: username});

   var map = {};
   localIssues.forEach(function (issue) {
      map[issue.number] = issue;
   });
   return map;
}

function prepareIssues(username, reponame) {
   var ghIssues = wrappedIssues.repoIssues({user: username, repo: reponame, perPage: 100, state: "all"});
   var localIssuesByNumber = localIssuesMap(username, reponame);
   addLocalProperties(ghIssues, localIssuesByNumber);
   return ghIssues;

   function addLocalProperties(ghIssues, localIssuesByNumber) {
      ghIssues.forEach(function (ghIssue) {
         var localIssue = localIssuesByNumber[ghIssue.number];
         if (localIssue) {
            ghIssue.priority = localIssue.priority;
            ghIssue.cost = localIssue.cost;
         }
      });
   }
}

function saveLocalData(reponame, username, number, cost, priority) {
   var id = LocalRepos.insert({reponame: reponame, username: username, number: number, cost: cost, priority: priority});
   var localIssue = LocalRepos.findOne({_id: {$eq: id}});
   return localIssue;
}


function createIssue(username, reponame, title, body, cost, priority, assigneeLogin, milestoneNumber) {
   var ghMsg = {
      user: username,
      repo: reponame,
      title: title,
      body: body,
      assignee: assigneeLogin,
      milestone: milestoneNumber,
      labels: []
   };
   pruneEmpties(ghMsg, ['milestone']);
   var newGhIssue = wrappedIssues.create(ghMsg);
   var localData = saveLocalData(reponame, username, newGhIssue.number, cost, priority);
   mergeProperties(localData, newGhIssue, ['cost', 'priority']);
   return newGhIssue;

   function mergeProperties(from, to, keysToMerge) {
      keysToMerge.forEach(function (key) {
         if (from[key]) {
            to[key] = from[key];
         }
      });
   }
}
Meteor.methods({
   'getRepositories': function getRepositories() {
      authenticateUser();
      var repos = wrappedRepos.getAll({user: getGitHubUsername(), type: "all", perPage: 100});
      return repos;
   },
   'getRepoIssues': function getRepoIssues(reponame, username) {
      authenticateUser();
      var issues = prepareIssues(username, reponame);
      return issues;
   },
   'getRepoMilestones': function (reponame, username) {
      authenticateUser();
      var milestones = wrappedIssues.getAllMilestones({user: username, repo: reponame});
      return milestones;
   },
   'getRepoCollaborators': function getRepoCollaborators(reponame, username) {
      authenticateUser();
      var collaborators = wrappedRepos.getCollaborators({user: username, repo: reponame, perPage: 100});
      return collaborators;
   },
   'createIssue': function (reponame, username, title, body, cost, priority, assigneeLogin, milestoneNumber) {
      authenticateUser();
      var newIssue = createIssue(username, reponame, title, body, cost, priority, assigneeLogin, milestoneNumber);
      return newIssue;
   },
   'getIssueComments': function getIssueComments(reponame, username, issueNumber) {
      authenticateUser();
      var comments = wrappedIssues.getComments({user: username, repo: reponame, number: issueNumber, perPage: 100});
      return comments;
   },
   'closeIssue': function(reponame, username, issueNumber) {
      authenticateUser();
      var closedIssue = wrappedIssues.edit({user: username, repo: reponame, number: issueNumber, state: 'closed'});
      return closedIssue;
   },
   'createComment': function createComment(reponame, username, issueNumber, body) {
      authenticateUser();
      var newComment = wrappedIssues.createComment({user: username, repo: reponame, number: issueNumber, body: body});
      return newComment;
   }
});
