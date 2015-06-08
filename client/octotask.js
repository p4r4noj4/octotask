Accounts.ui.config({
   requestPermissions: {
      github: ['user', 'repo', 'read:repo_hook']
   }
});

Meteor.subscribe("userData");