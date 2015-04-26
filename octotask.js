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
  
  var wrappedMarkdown = Async.wrap(github.markdown, ['render'])

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
      var repos = wrappedGithubRepos.getAll({user: getGitHubUsername(), type: "all", perPage: 100});
      return repos;
    },
    'getRepoIssues': function getRepoIssues(reponame, username) {
      authenticateUser();
      var issues = wrappedIssues.repoIssues({user: username, repo:reponame, perPage: 100, state: "all"});
      return issues;
    },
    'renderMarkdown': function renderMarkdown(textToRender, renderingContext) {
      var renderedText = wrappedMarkdown.render({text: textToRender, context: renderingContext, mode: "gfm"})
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
