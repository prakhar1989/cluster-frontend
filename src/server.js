var React = require('react');

var Server = React.createClass({
    render() {
        var apps = this.props.apps.map(function(app, i) {
            var className = "instance " + app.name.toLowerCase()
            return <div className={className} key={i}>
                <h3>{app.name.substr(0, 2)}</h3>
                <h5>{app.name}</h5>
            </div>
        });
        return <div className="server"> {apps} </div>
    }
});

module.exports = Server;
