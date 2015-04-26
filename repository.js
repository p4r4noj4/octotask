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
  
  
  Template.IssueItem.created = function() {
    //   this.renderedMarkdown = new ReactiveVar;
    //   this.renderedMarkdown.set(Template.currentData().body);
  }
  
  Template.IssueItem.helpers({
  })
  
  
  
}