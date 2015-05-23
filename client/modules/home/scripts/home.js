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