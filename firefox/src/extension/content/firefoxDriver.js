function FirefoxDriver(server) {
    this.server = server;
}

FirefoxDriver.prototype.get = function(url) {
    var server = this.server;
    new WebLoadingListener(function(request, stateFlags) {
        if (stateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP && stateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT) {
            var responseText = request.originalURI ? request.originalURI.spec : request.name;

            try {
                var channel = request.QueryInterface(Components.interfaces.nsIHttpChannel);
                responseText += " " + channel.responseStatus + " " + channel.responseStatusText;
            } catch (e) {
                responseText += " undefined undefined";
            }

            try {
                request.QueryInterface(Components.interfaces.nsIXMLHttpRequest)
                dump("Is XmlHttpRequest\n");
            } catch (e) {
                // Do nothing
            }
            Utils.getBrowser().removeProgressListener(this);
            server.respond("get", responseText);
        }
    });
    Utils.getBrowser().loadURI(url);
}

FirefoxDriver.prototype.title = function() {
    this.server.respond("title", Utils.getBrowser().contentTitle);
};

FirefoxDriver.prototype.selectText = function(xpath) {
    var result = Utils.getDocument().evaluate(xpath, Utils.getDocument(), null, Components.interfaces.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (result) {
        // Handle Title elements slightly differently. On the plus side, IE does this too :)
        if (result.tagName == "TITLE") {
            this.server.respond("selectText", Utils.getBrowser().contentTitle);
        } else {
            this.server.respond("selectText", Utils.getText(result));
        }
    } else {
        this.server.respond("selectText", "");
    }
};

FirefoxDriver.prototype.selectElementUsingXPath = function(xpath) {
    var result = Utils.getDocument().evaluate(xpath, Utils.getDocument(), null, Components.interfaces.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (result) {
        var index = Utils.addToKnownElements(result);
        this.server.respond("selectElementUsingXPath", index);
    } else {
        this.server.respond("selectElementUsingXPath");
    }
};

FirefoxDriver.prototype.selectElementUsingLink = function(linkText) {
    var allLinks = Utils.getDocument().getElementsByTagName("A");
    var index;
    for (var i = 0; i < allLinks.length && !index; i++) {
        var text = Utils.getText(allLinks[i]);
        if (linkText == text) {
            index = Utils.addToKnownElements(allLinks[i]);
        }
    }
    if (index !== undefined) {
        this.server.respond("selectElementUsingLink", index);
    } else {
        this.server.respond("selectElementUsingLink");
    }
};

FirefoxDriver.prototype.selectElementsUsingXPath = function(xpath) {
    var result = Utils.getDocument().evaluate(xpath, Utils.getDocument(), null, Components.interfaces.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var response = "";
    var element = result.iterateNext();
    while (element) {
        var index = Utils.addToKnownElements(element);
        response += index + ",";
        element = result.iterateNext();
    }
    response = response.substring(0, response.length - 1);
    // Strip the trailing comma
    this.server.respond("selectElementsUsingXPath", response);
};