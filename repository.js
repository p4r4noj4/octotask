if( Meteor.isClient ) {
    
    Session.setDefault('issues', [])
    
  Template.Repository.helpers({
    issues: function() {
        Meteor.call('getRepoIssues', Router.current().params.reponame, Router.current().params.username, function(error, result) {
            Session.set('issues', result);
        });
        return Session.get('issues');
    }
  });
  
  
  
  
  Template.IssueItem.events({
      'click #showComments': function() {
          $("#" + Template.instance().commentsId.get()).collapse('toggle');
      }
  });
  
  
  Template.IssueItem.created = function() {
      this.commentsId = new ReactiveVar;
      this.commentsId.set("commentsPanel" + Template.currentData().id.toString());
      
      this.comments = new ReactiveVar;
      this.comments.set([]);
      var commentsReactiveVar = Template.instance().comments;
      $("#" + this.commentsId.get()).collapse({parent: ".allIssues"});
      $("#" + this.commentsId.get()).on("show.bs.collapse", function() {
          Meteor.call('getIssueComments', Router.current().params.reponame, Router.current().params.username, Template.currentData().number, function(error, result) {
              commentsReactiveVar.set(result);
          });
      });
  }
  
  Template.IssueItem.helpers({
      commentsId: function() {
          return Template.instance().commentsId.get();
      },
      comments: function() {
          return Template.instance().comments.get();
      }
  })
  
  
  
}