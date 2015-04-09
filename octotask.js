if (Meteor.isClient) {
  Session.setDefault('repositories', []);

  getRepositories = function getRepositories(username, userToken) {
    Meteor.call('getRepositories', username, userToken, function (error, result) {
      Session.set('repositories', result);
    });
  };

  Template.home.helpers({
    repositories: function() {
      if (Meteor.user() && Meteor.user().services.github.accessToken) {
        getRepositories(Meteor.user().services.github.username, Meteor.user().services.github.accessToken);
      }
      return Session.get('repositories');
    }
  });

  Template.home.events({
    'click #refresh-repos': function () {
      getRepositories(Meteor.user().services.github.username, Meteor.user().services.github.accessToken);
    }
  });

  Template.repository.helpers({
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

  Meteor.methods({
    'getRepositories': function getRepositories(username, userToken) {
      github.authenticate({
        type: "oauth",
        token: userToken
      });
      var repos = wrappedGithubRepos.getAll({user: username, type: "owner"});
      return repos;
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
