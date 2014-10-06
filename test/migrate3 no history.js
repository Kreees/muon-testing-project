var Q = require("q");
var u = require('./lib/utils.js');
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};

describe('Migration module test m3: migrate without history.Add models, hasOne/hasMany relations.', function() {
    before(function(done){
        var p = Q();
        Q.all([
            u.clearHistory(cfg),    
            u.resetDatabases(['testdb', 'somedb']), 
            u.resetModels(cfg, cfg.path + '/test/model_sets/m2/init/'),
            u.setMode('migration')
        ]).then(function(){
            return m.migration.migrate();
        }).done(function(){
            done();
        },function(err){
            u.dbg(err +' (rejected)');
            done(err);
        });
    });
    
    describe('Check application database tables.', function(){
        it('should detect new table - default.person', function(done) {
            u.addAndCheckInst('person', {surname: 'Opel', name: 'Andy', age: 23}, done);
        });
        it('should detect new table - default.pet', function(done) {
            u.addAndCheckInst('pet', {kind: 'cat', name: 'mimi', age: 2}, done);    
        });
        it('should detect new table - default.trash', function(done) {
            u.addAndCheckInst('trash', {lolo: 'mytrash', trollolo: 'notrash'}, done);    
        });
        it('should detect new table - default1.trash2', function(done) {
            u.addAndCheckInst('trash2', {value: 'mytrashhhh', param: 'notrashhh', num: 10}, done);    
        });
        it('should detect new table - default1.person1', function(done) {
            u.addAndCheckInst('person1', {surname: 'Lav', name: 'Na', age: 30}, done);    
        });
    });
    
    xdescribe('Check migration history.', function(){
        
    });
    describe('Check finish.', function(){
        var runSet = function(){
            it('should detect nothing to sync.', function() {
                m.diff.need.should.be.false;
            });
            it('should be empty.', function() {
                m.diff.addModel.should.eql({});
                m.diff.addManyA.should.eql({});
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
        };
        describe('Reload Migration mode.',function(){
            before(function(done){
                u.setMode('migration').done(function(){
                    done();
                },function(err){
                    done(err);
                });
            });
            runSet();
        });
        describe('Development mode.',function(){
            before(function(done){
                u.setMode('development').done(function(){
                    done();
                },function(err){
                    done(err);
                });
            });
            runSet();
        });
        
    });      
});