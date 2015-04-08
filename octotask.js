if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.home.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.home.events({
    'click a': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });

  Accounts.ui.config({
    requestPermissions: {
      github: ['user', 'repo', 'read:repo_hook']
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
