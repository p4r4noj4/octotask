if (Meteor.isClient) {
  Session.setDefault('repositories', []);

  getRepositories = function getRepositories() {
    Meteor.call('getRepositories', function (error, result) {
      Session.set('repositories', result);
    });
  };

  Template.home.helpers({
    repositories: function() {
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

  Template.Repository.helpers({
    
  });

  Accounts.ui.config({
    requestPermissions: {
      github: ['user', 'repo', 'read:repo_hook']
    }
  });
}

if (Meteor.isServer) {


  var GitHubAPI = Meteor.npmRequire("github");
  var github = new GitHubAPI( {
    version: "3.0.0"
  });

  var wrappedGithubRepos = Async.wrap(github.repos, ['getFromUser', 'getHooks', 'getAll']);
  
  var wrappedIssues = Async.wrap(github.issues, ['repoIssues', 'getComments']);

  var authenticateUser = function() {
    github.authenticate({
        type: "oauth",
        token: Meteor.user().services.github.accessToken
    });
  };
  
  var getGitHubUsername = function() {
    return Meteor.user().services.github.username;
  };

  Meteor.methods({
    'getRepositories': function getRepositories() {
      authenticateUser();
      var repos = wrappedGithubRepos.getAll({user: getGitHubUsername(), type: "all"});
      return repos;
    },
    'getRepoIssues': function getRepoIssues(repo) {
      
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
