Meteor.startup(function () {
   // code to run on server at startup
});

Meteor.methods({
   'updateIssue': function(reponame, username, issueNumber, newCost, newPriority) {
      LocalRepos.upsert({reponame: reponame, username: username, number: issueNumber},
         {reponame: reponame, username: username, number: issueNumber, cost: newCost, priority: newPriority});
      if(isNaN(newCost)) {
         LocalRepos.update({reponame: reponame, username: username, number: issueNumber},
            { $unset: {cost: ""}});
      }
      if(isNaN(newPriority)) {
         LocalRepos.update({reponame: reponame, username: username, number: issueNumber},
            { $unset: {priority: ""}});
      }

      var localIssue = LocalRepos.findOne({reponame: reponame, username: username, number: issueNumber});
      return localIssue;
   }
});

Meteor.publish("userData", function () {
   if (this.userId) {
      return Meteor.users.find({_id: this.userId},
         {fields: {'services.github.accessToken': 1}});
   } else {
      this.ready();
   }
});