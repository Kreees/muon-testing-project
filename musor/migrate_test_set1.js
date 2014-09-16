//var m = require('muon');
var Q = require("q");
//var dbg = true;
var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");

process.exit = function() {};


describe('migration module test: case 1 (add a model)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set1/models_ch/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set1/models_ch/';
    before(function() {
        if (!g.file.exists(dir))
            g.file.mkdir(dir);
        if (g.file.exists(cfg.path + '/migrations/history.db'))
            fs.unlink(cfg.path + '/migrations/history.db', function(err) {
                if (err) console.log('unlinking error 1 ' + err)
            });
        if(g.file.exists(cfg.path + '/undefined.db'))
            fs.unlink(cfg.path + '/undefined.db', function(err) {
                if (err) console.log('unlinking error 2 ' + err)
            });
        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            if (err) {console.log('readdir error ' + err)}
            for (var i in models) {
                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {if (err) console.log('unlinking error 3 ' +err)});
            }
        });
        fs.readdir(test_models_source_path, function(err, models) {
            if (err) {console.log(err)}
            for (var i in models) {
                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
            }
        });
    });

    it('should detect a new model', function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
        muon.once('migrate-ready', function() {
            console.log('muon ready');
    //            console.log('diff.need is ' + diff.need);
            done();
        });


    });

    it('should add model to the database', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
//        var muon = require('muon');

        muon.reload(__mcfg__, function() {
            done();
        });

//        muon.once('migrate-ready', function() {
//            console.log('muon ready');
////            console.log('diff.need is ' + diff.need);
//            done();
//        });
    });

    it('should detect nothing', function(done) {
        global.__mcfg__ = { serverMode: 'development' };
//        muon = require('muon');
        muon.reload(__mcfg__,function() {
            done();
//            muon.once('migrate-ready', function() {
//                console.log('muon ready');
//
////            console.log('diff.need is ' + diff.need);
//                done();
//            });
        })

    });

    it('should create an instance in a database', function(done) {
        for (var i in m.app.models) {
            console.log(i)
            var Person = m.app.models[i];
        }
//        var Person = m.app.models.person;
        Person.sync(function() {
            console.log('table synced');
//            done();
            var per1 = new Person;
            per1.name = 'Andy';
            per1.surname = 'Warhol';
            per1.age = 150;
            per1.save(done);
        });
//        var per1 = new Person;
//        per1.name = 'Andy';
//        per1.surname = 'Warhol';
//        per1.age = 150;
//        per1.save();
    });

    after(function(done) {
        done()
    });

});