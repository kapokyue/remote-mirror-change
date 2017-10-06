var fs = require( 'fs' ),
    path = require( 'path' ),
    rimraf = require( 'rimraf' ),
    mkdirp = require( 'mkdirp' );

const PATH = process.argv[ 2 ];

if ( !PATH ) {
    return console.error( 'Path is missing' );
}

function log( str ) {
    console.log( ( new Date() ).toLocaleString(), str );
}

var gitRevParse = require( './git-rev-parse' );

function whenCommitSame() {
    var commits = [ gitRevParse( '.' ), gitRevParse( PATH ) ];

    return Promise.all( commits ).then( ( [ hash1, hash2 ] ) => {
        if ( hash1 != hash2 ) {
            throw 'Commit is not the same !';
        }
    } );
}

whenCommitSame().then( () => {

    setInterval( () => {
        whenCommitSame().catch( msg => {
            console.error( msg );
            process.exit();
        });
    }, 5000 );

    var copyqueue = {};

    var copy = file => {

        var rs = fs.createReadStream( file ),
            ws = fs.createWriteStream( path.join( PATH, file ) );

        rs.pipe( ws );

        ws.on( 'finish', function () {
            log( `Copy: ${file}` );
        } );

        ws.on( 'error', console.error );

        delete copyqueue[ file ];

    };

    var deferCopy = file => {

        if ( copyqueue[ file ] ) {
            clearTimeout( copyqueue[ file ] );
        }

        copyqueue[ file ] = setTimeout( copy, 1000, file );

    };

    var del = file => {
        file = path.join( PATH, file );
        rimraf( file, e => {
            if ( e ) {
                console.error( e );
            } else {
                log( `Remove: ${file}` );
            }
        } );
    };

    var addDir = dir => {
        dir = path.join( PATH, dir );
        mkdirp( dir, function ( err ) {
            if ( err ) {
                console.error( err );
            } else {
                log( `Dir: ${dir}` );
            }
        } );
    };

    var actions = {
        'add': deferCopy,
        'change': deferCopy,
        'addDir': addDir,
        'unlink': del,
        'unlinkDir': del,
    };

    var chokidar = require( 'chokidar' );

    chokidar.watch( '.', {

        ignored: /.git(\/|\\)/,
        ignoreInitial: true,

    } ).on( 'all', ( event, file ) => {

        if ( !actions[ event ] ) {
            return console.error( `No this action: ${action}` );
        }

        actions[ event ]( file );

        } ).on( 'error', console.error );

}, console.error );
