// Ref: https://github.com/nowzoo/git-get-status/blob/master/index.js

var parse_status = function ( str ) {
    var lines;
    var branch_line;
    var branches;
    var status = {
        local_branch: null,
        remote_branch: null,
        remote_diff: null,
        files: [],
    };
    var result;
    var initial_commit_rx = /^\#\# Initial commit on ([^\n]+)\s?$/;

    lines = str.trim().split( '\n' );
    branch_line = lines.shift();

    result = branch_line.match( initial_commit_rx );
    if ( result ) {
        status.local_branch = result[ 1 ];
        return status;
    }

    branch_line = branch_line.replace( /\#\#\s+/, '' );

    branches = branch_line.split( '...' );
    status.local_branch = branches[ 0 ];
    status.remote_diff = null;

    if ( branches[ 1 ] ) {
        result = branches[ 1 ].match( /^([^\s]+)/ );
        status.remote_branch = result[ 1 ];
        result = branches[ 1 ].match( /\[([^\]]+)\]/ );
        status.remote_diff = result ? result[ 1 ] : null;
    }

    status.files = lines.map( str => {
        if ( str.match( /\S/ ) ) {
            str = str.trim();

            var si = str.indexOf( ' ' );

            return [
                str.substring( 0, si ),
                str.substring( si + 1 ),
            ];
        }
    } );

    return status;
};

module.exports = function ( callback ) {
    var exec = require( 'child_process' ).exec;
    var cmd = 'git status --porcelain -b';
    exec( cmd, function ( err, stdout ) {
        if ( err ) return callback( err );
        callback( null, parse_status( stdout ) );
    } );
};
