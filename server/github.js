var GitHubAPI = Meteor.npmRequire("github");
var github = new GitHubAPI({
   version: "3.0.0",
   debug: true
});

var wrappedRepos = Async.wrap(github.repos, ['getFromUser', 'getHooks', 'getAll', 'getCollaborators']);

var wrappedIssues = Async.wrap(github.issues, ['create', 'repoIssues', 'getComments', 'createComment', 'getAllMilestones']);

var authenticateUser = function () {
   github.authenticate({
      type: "oauth",
      token: Meteor.user().services.github.accessToken
   });
};

var getGitHubUsername = function () {
   return Meteor.user().services.github.username;
};

function pruneEmpties(msg, keysToCheck) {
   keysToCheck.forEach(function (key) {
      if (!msg[key]) {
         delete msg[key];
      }
   });
}

Meteor.methods({
   'getRepositories': function getRepositories() {
      authenticateUser();
      var repos = wrappedRepos.getAll({user: getGitHubUsername(), type: "all", perPage: 100});
      return repos;
   },
   'getRepoIssues': function getRepoIssues(reponame, username) {
      authenticateUser();
      var issues = wrappedIssues.repoIssues({user: username, repo: reponame, perPage: 100, state: "all"});
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
   'createIssue': function (reponame, username, title, body, assigneeLogin, milestoneNumber) {
      authenticateUser();
      var msg = {
         user: username,
         repo: reponame,
         title: title,
         body: body,
         assignee: assigneeLogin,
         milestone: milestoneNumber,
         labels: []
      };
      pruneEmpties(msg, ['milestone']);
      var newIssue = wrappedIssues.create(msg);
      return newIssue;
   },
   'getIssueComments': function getIssueComments(reponame, username, issueNumber) {
      authenticateUser();
      var comments = wrappedIssues.getComments({user: username, repo: reponame, number: issueNumber, perPage: 100});
      return comments;
   },
   'createComment': function createComment(reponame, username, issueNumber, body) {
      authenticateUser();
      var newComment = wrappedIssues.createComment({user: username, repo: reponame, number: issueNumber, body: body});
      return newComment;
   }
});