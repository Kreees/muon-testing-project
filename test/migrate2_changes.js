var Q = require("q");
var u = require('./lib/utils.js');
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};

describe('migration module test m2: detect scheme changes', function() {
    before(function(done){
        Q.all([
        u.clearHistory(cfg),    
        u.resetDatabases(['testdb', 'somedb']), 
        u.resetModels(cfg, cfg.path + '/test/model_sets/m2/init/')]).done(function(){
            done();
        },function(err){
            u.dbg(err +' (rejected)');
            done(err);
        });
    });
    
    describe('Without migration history.', function() {
        before(function(done) {
            u.setMode('development').done(function(){
                done();
            }, function(err){
                done(err);
            });
        });
        describe('Development mode.', function(){
            it('should detect need to sync', function() {
                m.diff.need.should.be.true;
            });
            it('should detect new models (2 databases)', function() {
                m.diff.addModel['default'].should.be.Object;
                m.diff.addModel['default1'].should.be.Object;
            });
            it('should detect add hasMany - pet', function() {
                m.diff.addManyA['default'].should.be.Object;
                m.diff.addManyA['default'].pet.should.be.Object;
            });
            it('should be empty', function() {
                m.diff.rmModel.should.eql({});
                m.diff.rmAttr.should.eql({});
                m.diff.addAttr.should.eql({});
                m.diff.addOneA.should.eql({});
                m.diff.rmOneA.should.eql({});
                m.diff.rmManyA.should.eql({});
                m.diff.changes.should.eql({});
                m.diff.changeDb.should.eql({});
                m.diff.changeModelDb.should.eql({});
                m.diff.err.should.eql({});
            });
        });
        describe('Migration mode.', function(){
            before(function(done){
                u.setMode('migration').done(function() { done();}, function(err) { done(err);});
            });
            it('should detect need to sync', function() {
                m.diff.need.should.be.true;
            });
            it('should detect new models (2 databases)', function() {
                m.diff.addModel['default'].should.be.Object;
                m.diff.addModel['default'].length.should.eql(3);
                m.diff.addModel['default1'].should.be.Object;
                m.diff.addModel['default1'].length.should.eql(2);
            });
            it('should detect add hasMany - pet', function() {
                m.diff.addManyA['default'].should.be.Object;
                m.diff.addManyA['default'].pet.should.be.Object;
            });
            it('should be empty', function() {
                m.diff.rmModel.should.eql({});
                m.diff.rmAttr.should.eql({});
                m.diff.addAttr.should.eql({});
                m.diff.addOneA.should.eql({});
                m.diff.rmOneA.should.eql({});
                m.diff.rmManyA.should.eql({});
                m.diff.changes.should.eql({});
                m.diff.changeDb.should.eql({});
                m.diff.changeModelDb.should.eql({});
                m.diff.err.should.eql({});
            });
        });
    });
    describe('With migration history.', function() {
        before(function(done) {
            var p = Q();
            p.then(function(){
                return u.setMode('migration');
            }).then(function(){
                return m.migration.migrate();
            }).then(function(){
                return u.resetModels(cfg, cfg.path + '/test/model_sets/m2/changed/');
            }).then(function(){
               return u.setMode('development');
            }).done(function(){
                done();
            }, function(err){
                done(err);
            });
        });
        it('should need to sync', function() {
            m.diff.need.should.be.true;
        });
        it('should be empty', function() {
            m.diff.changes.should.eql({});
            m.diff.changeDb.should.eql({});
            m.diff.changeModelDb.should.eql({});
            m.diff.err.should.eql({});
        });
        describe('Database - default.',function(){
            it('should detect new model', function() {
                m.diff.addModel['default'].should.be.Array;
                m.diff.addModel['default'].length.should.eql(1);
            });
            it('should remove model', function() {
                m.diff.rmModel['default'].should.be.Array;
                m.diff.rmModel['default'].length.should.eql(1);
            });
            it('should detect new attr - person', function() {
                m.diff.addAttr['default'].should.be.Object;
                m.diff.addAttr['default'].person.should.be.Object;
            });
            it('should detect remove attr - person', function() {
                m.diff.rmAttr['default'].should.be.Object;
                m.diff.rmAttr['default'].person.should.be.Object;
            });
            it('should detect add hasOne - person', function() {
                m.diff.addOneA['default'].should.be.Object;
                m.diff.addOneA['default'].person.should.be.Object;
            });
            it('should detect add hasMany - person', function() {
                m.diff.addManyA['default'].should.be.Object;
                m.diff.addManyA['default'].person.should.be.Object;
            });
            it('should detect remove hasMany - pet', function() {
                m.diff.rmManyA['default'].should.be.Object;
                m.diff.rmManyA['default'].pet.should.be.Object;
            });
            it('should detect remove hasOne - pet', function() {
                m.diff.rmOneA['default'].should.be.Object;
                m.diff.rmOneA['default'].pet.should.be.Object;
            });
            
        });
        describe('Database - default1',function(){
            it('should detect 1 new model', function() {
                m.diff.addModel['default1'].should.be.Array;
                m.diff.addModel['default1'].length.should.eql(1);
            });
            it('should remove model', function() {
                m.diff.rmModel['default'].should.be.Array;
                m.diff.rmModel['default'].length.should.eql(1);
            });
            it('should detect new attr - person1', function() {
                m.diff.addAttr['default1'].should.be.Object;
                m.diff.addAttr['default1'].person1.should.be.Object;
            });
            it('should detect remove attr - person1', function() {
                m.diff.rmAttr['default1'].should.be.Object;
                m.diff.rmAttr['default1'].person1.should.be.Object;
            });
            it('should detect add hasOne - person1', function() {
                m.diff.addOneA['default1'].should.be.Object;
                m.diff.addOneA['default1'].person1.should.be.Object;
            });
            it('should detect add hasMany - person1', function() {
                m.diff.addManyA['default1'].should.be.Object;
                m.diff.addManyA['default1'].person1.should.be.Object;
            });
        });
    });
});