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
      },
      'show.bs.collapse': function() {
            var commentsReactiveVar = Template.instance().comments;
            Meteor.call('getIssueComments', Router.current().params.reponame, Router.current().params.username, Template.currentData().number, function(error, result) {
                commentsReactiveVar.set(result);
            });
      }
  });
  
  
  Template.IssueItem.created = function() {
      this.commentsId = new ReactiveVar;
      this.commentsId.set("commentsPanel" + Template.currentData().id.toString());
      
      this.comments = new ReactiveVar;
      this.comments.set([]);
      $("#" + this.commentsId.get()).collapse({parent: ".allIssues"});
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