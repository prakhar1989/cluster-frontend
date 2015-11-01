var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('underscore');
var Server = require('./server');

var Cluster = React.createClass({
    getDefaultProps() {
        return {
            appTypes: ["Spark", "Hadoop", "Rails", "Chronos", "Storm"] 
        }
    },
    getInitialState() {
        // stores appId -> serverId map
        this.appMap = {};
        var servers = _.map(_.range(this.props.serverCount), function(s) {
            return { apps: [] }
        });
        return {
            servers: servers,
            appId: 0
        }
    },
    addServer() {
        this.setState({
            servers: this.state.servers.concat([{
                apps: []
            }])
        });
    },
    findIndexForApp(servers) {
        var serverIndex = _.findIndex(servers, function(s) {
            return s.apps.length == 0
        });
        // found an empty server
        if (serverIndex > -1) {
            return serverIndex
        } 
        // search for a server with one free space
        return _.findIndex(servers, function(s) {
            return s.apps.length == 1
        });
    },
    dropServer() {
        var servers = JSON.parse(JSON.stringify(this.state.servers));
        var apps = this.props.appTypes;
        var lastServer = servers[servers.length - 1];
        servers.splice(-1, 1);
        var foundReplacements = true;
        _.each(lastServer.apps, function(app) {
            var index = this.findIndexForApp(servers);
            if (index > -1) {
                this.appMap[app.id] = index;
                servers[index].apps.push(app);
            } else {
                foundReplacements = false;
            }
        }.bind(this));
        if (!foundReplacements) {
            var choice = confirm("Apps running on the server will be killed. Are you " + 
                    "sure you want to continue?");
            if (!choice) {
                return;
            }
        }
        this.setState({ servers: servers });
    },
    addApp(index) {
        var app = this.props.appTypes[index];
        var { servers, appId } = this.state;
        var serverIndex = this.findIndexForApp(servers);
        if (serverIndex > -1) {
            let id = appId + 1;
            this.appMap[id] = serverIndex;
            servers[serverIndex].apps.push({
                id: id,
                name: app,
                created_at: Date.now()
            });
            this.setState({ 
                servers: servers,
                appId: id
            });
        } else {
            alert("No space in the cluster for this app. Please start more servers");
        }
    },
    destroyApp(index) {
        var appName = this.props.appTypes[index];
        var app = _.chain(this.state.servers)
                    .pluck('apps')
                    .flatten()
                    .filter((x) => x.name === appName)
                    .sortBy((x) => -1 * x.id)
                    .head().value();
        // if app exists
        if (!_.isUndefined(app)) {
            let servers = this.state.servers;
            let serverIndex = this.appMap[app.id];
            let server = servers[serverIndex];
            let appIndex = _.findIndex(servers[serverIndex].apps, (x) => x.id === app.id );
            server.apps.splice(appIndex, 1);

            // remove key and update state
            delete this.appMap[app.id]
            this.setState({
                servers: servers
            });
        }
    },
    render() {
        var servers = this.state.servers.map(function(s, i) {
            return <Server key={i} apps={s.apps}></Server>
        });
        var appList = this.props.appTypes.map(function(a, i) {
            return (<li key={i}>{a} 
                    <div className="actions">
                    <button onClick={this.addApp.bind(null, i)}>+</button>
                    <button onClick={this.destroyApp.bind(null, i)}>-</button>
                </div>
            </li>)
        }.bind(this));

        return (<div>
            <div className="sidebar">
                <div className="server-action">
                    <button className="big" onClick={this.addServer}>+</button>
                    <p>Add Server</p>
                </div>
                <div className="server-action">
                    <button className="big" onClick={this.dropServer}>-</button>
                    <p>Destroy</p>
                </div>
                <div className='app-area'>
                    <p>Available apps</p>
                    <ul> {appList} </ul>
                </div>
            </div>
            <div className='server-area'> 
                <h1>Server Canvas</h1>
                <div className="servers">{servers}</div>
            </div>
        </div>)
    }
});

ReactDOM.render(<Cluster serverCount={4} />,document.getElementById("app"))
