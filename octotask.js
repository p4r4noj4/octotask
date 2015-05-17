if (Meteor.isClient) {
   Session.setDefault('repositories', []);

   getRepositories = function getRepositories() {
      Meteor.call('getRepositories', function (error, result) {
         Session.set('repositories', result);
      });
   };


   // Template.registerHelper('renderMarkdown', function(text, username, reponame) {
   //   var context = username + "/" + reponame;
   //     Meteor.call('renderMarkdown', text, context, function(error, result) {
   //         Template.instance().renderedMarkdown.set(result);
   //     });
   //     return Template.instance().renderedMarkdown.get();
   // });

   Template.home.helpers({
      repositories: function () {
         if (Meteor.user() && Meteor.user().services.github.accessToken) {
            getRepositories();
         }
         return Session.get('repositories');
      }
   });

   Template.home.events({
      'click #refresh-repos': function () {
         getRepositories();
      }
   });


   Accounts.ui.config({
      requestPermissions: {
         github: ['user', 'repo', 'read:repo_hook']
      }
   });
}


if (Meteor.isServer) {


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
         var msg = {user: username, repo: reponame, title: title, body: body, assignee: assigneeLogin, milestone: milestoneNumber, labels: []};
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

   Meteor.startup(function () {
      // code to run on server at startup
   });
}
