
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'node with oracle' , sub: 'TEST of insert to oracle' });
};