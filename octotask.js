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
      debug: false
   });

   var wrappedRepos = Async.wrap(github.repos, ['getFromUser', 'getHooks', 'getAll', 'getCollaborators']);

   var wrappedIssues = Async.wrap(github.issues, ['create', 'repoIssues', 'getComments', 'createComment']);

   var authenticateUser = function () {
      github.authenticate({
         type: "oauth",
         token: Meteor.user().services.github.accessToken
      });
   };

   var getGitHubUsername = function () {
      return Meteor.user().services.github.username;
   };

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
      'getRepoCollaborators': function getRepoCollaborators(reponame, username) {
         authenticateUser();
         var collaborators = wrappedRepos.getCollaborators({user: username, repo: reponame, perPage: 100});
         return collaborators;
      },
      'createIssue': function (reponame, username, title, body, assigneeLogin) {
         authenticateUser();
         var newIssue = wrappedIssues.create({user: username, repo: reponame, title: title, body: body, assignee: assigneeLogin, labels: []});
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
