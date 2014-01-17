/*
* Kendo UI DataViz v2013.3.1316 (http://kendoui.com)
* Copyright 2014 Telerik AD. All rights reserved.
*
* Kendo UI DataViz commercial licenses may be obtained at
* https://www.kendoui.com/purchase/license-agreement/kendo-ui-dataviz-commercial.aspx
* If you do not own a commercial license, this file shall be governed by the trial license terms.
*/
(function () {

    // TODO
    // Remove duplicate functions from core, chart, map

    // Imports ================================================================
    var math = Math,
        kendo = window.kendo,
        deepExtend = kendo.deepExtend,
        dataviz = kendo.dataviz;

    // Constants
    var DEG_TO_RAD = math.PI / 180,
        UNDEFINED = "undefined";

    // Generic utility functions ==============================================
    function defined(value) {
        return typeof value !== UNDEFINED;
    }

    function round(value, precision) {
        var power = math.pow(10, precision || 0);
        return math.round(value * power) / power;
    }

    function limitValue(value, min, max) {
        return math.max(math.min(value, max), min);
    }

    function rad(degrees) {
        return degrees * DEG_TO_RAD;
    }

    function deg(radians) {
        return radians / DEG_TO_RAD;
    }

    function alignToPixel(coord) {
        return math.round(coord) + 0.5;
    }

    function isNumber(val) {
        return typeof val === "number" && !isNaN(val);
    }

    function valueOrDefault(value, defaultValue) {
        return defined(value) ? value : defaultValue;
    }

    // Template helpers =======================================================
    function renderAttr(name, value) {
        return defined(value) ? " " + name + "='" + value + "' " : "";
    }

    function renderAllAttr(attrs) {
        var output = "";
        for (var i = 0; i < attrs.length; i++) {
            output += renderAttr(attrs[i][0], attrs[i][1]);
        }

        return output;
    }

    function renderSize(size) {
        if (typeof size !== "string") {
            size += "px";
        }

        return size;
    }

    function renderPos(pos) {
        var result = [];

        if (pos) {
            var parts = kendo.toHyphens(pos).split("-");

            for (var i = 0; i < parts.length; i++) {
                result.push("k-pos-" + parts[i]);
            }
        }

        return result.join(" ");
    }

    // Mixins =================================================================
    function geometryChange() {
        if (this.observer) {
            this.observer.geometryChange();
        }
    }

    // Exports ================================================================
    deepExtend(dataviz, {
        util: {
            mixins: {
                geometryChange: geometryChange
            },

            alignToPixel: alignToPixel,
            defined: defined,
            deg: deg,
            isNumber: isNumber,
            limitValue: limitValue,
            round: round,
            rad: rad,
            renderAttr: renderAttr,
            renderAllAttr: renderAllAttr,
            renderPos: renderPos,
            renderSize: renderSize,
            valueOrDefault: valueOrDefault
        }
    });

})(window.kendo.jQuery);
(function () {

    // Imports ================================================================
    var math = Math,

        kendo = window.kendo,
        Class = kendo.Class,
        deepExtend = kendo.deepExtend,

        dataviz = kendo.dataviz,
        util = dataviz.util,
        defined = util.defined,
        rad = util.rad,
        round = util.round;

    // Geometrical primitives =================================================
    var Point = Class.extend({
        init: function(x, y) {
            this.x = x || 0;
            this.y = y || 0;

            this.observer = null;
        },

        geometryChange: util.mixins.geometryChange,

        set: function(field, value) {
            if (field === "x") {
                if (this.x !== value) {
                    this.x = value;
                    this.geometryChange();
                }
            } else if (field === "y") {
                if (this.y !== value) {
                    this.y = value;
                    this.geometryChange();
                }
            }
        },

        get: function(field) {
            if (field === "x") {
                return this.x;
            } else if (field === "y") {
                return this.y;
            }
        },

        equals: function(point) {
            return point && point.x === this.x && point.y === this.y;
        },

        clone: function() {
            return new Point(this.x, this.y);
        },

        rotate: function(center, degrees) {
            var theta = rad(degrees);
            var cosT = math.cos(theta);
            var sinT = math.sin(theta);
            var cx = center.x;
            var cy = center.y;
            var x = this.x;
            var y = this.y;

            this.x = cx + (x - cx) * cosT + (y - cy) * sinT;
            this.y = cy + (y - cy) * cosT - (x - cx) * sinT;

            this.geometryChange();

            return this;
        },

        multiply: function(a) {
            this.x *= a;
            this.y *= a;

            this.geometryChange();

            return this;
        },

        transform: function(mx) {
            this.x = mx.a * this.x + mx.c * this.y + mx.e;
            this.y = mx.b * this.x + mx.d * this.y + mx.f;

            this.geometryChange();

            return this;
        },

        add: function(other) {
            this.x += other.x;
            this.y += other.y;

            return this;
        },

        subtract: function(other) {
            this.x -= other.x;
            this.y -= other.y;

            return this;
        },

        distanceTo: function(other) {
            var dx = this.x - other.x;
            var dy = this.y - other.y;

            return math.sqrt(dx * dx + dy * dy);
        },

        round: function(precision) {
            this.x = round(this.x, precision);
            this.y = round(this.y, precision);
            return this;
        }
    });

    // IE < 9 doesn't allow to override toString on definition
    Point.fn.toString = function(precision, separator) {
        var x = this.x,
            y = this.y;

        if (defined(precision)) {
            x = round(x, precision);
            y = round(y, precision);
        }

        separator = separator || " ";
        return x + separator + y;
    };

    var Rect = Class.extend({
        init: function(p0, p1) {
            this.p0 = p0 || new Point();
            this.p1 = p1 || new Point();

            this.observer = null;
            this.p0.observer = this;
            this.p1.observer = this;
        },

        geometryChange: util.mixins.geometryChange,

        width: function() {
            return this.p1.x - this.p0.x;
        },

        height: function() {
            return this.p1.y - this.p0.y;
        }
    });

    var Circle = Class.extend({
        init: function(center, radius) {
            this.center = center || new Point();
            this.radius = radius || 0;

            this.observer = null;
            this.center.observer = this;
        },

        geometryChange: util.mixins.geometryChange,

        equals: function(other) {
            return  other &&
                    other.center.equals(this.center) &&
                    other.radius === this.radius;
        },

        clone: function() {
            return new Circle(this.center.clone(), this.radius);
        },

        set: function(field, value) {
            if (field === "radius" && this.radius !== value) {
                this.radius = value;
                this.geometryChange();
            }
        },

        get: function() {
            return this.radius;
        },

        pointAt: function(angle) {
            var c = this.center,
                r = this.radius,
                a = rad(angle);

            return new Point(
                c.x - r * math.cos(a),
                c.y - r * math.sin(a)
            );
        }
    });

    // TODO: MERGE WITH DIAGRAM MATH
    var Matrix = Class.extend({
        init: function (a, b, c, d, e, f) {
            this.a = a || 0;
            this.b = b || 0;
            this.c = c || 0;
            this.d = d || 0;
            this.e = e || 0;
            this.f = f || 0;
        },
        times: function (m) {
            return new Matrix(
                this.a * m.a + this.c * m.b,
                this.b * m.a + this.d * m.b,
                this.a * m.c + this.c * m.d,
                this.b * m.c + this.d * m.d,
                this.a * m.e + this.c * m.f + this.e,
                this.b * m.e + this.d * m.f + this.f
            );
        }
    });

    deepExtend(Matrix, {
        translate: function (x, y) {
            var m = new Matrix();
            m.a = 1;
            m.b = 0;
            m.c = 0;
            m.d = 1;
            m.e = x;
            m.f = y;
            return m;
        },
        unit: function () {
            return new Matrix(1, 0, 0, 1, 0, 0);
        },
        rotate: function (angle, x, y) {
            var m = new Matrix();
            m.a = math.cos(rad(angle));
            m.b = math.sin(rad(angle));
            m.c = -m.b;
            m.d = m.a;
            m.e = (x - x * m.a + y * m.b) || 0;
            m.f = (y - y * m.a - x * m.b) || 0;
            return m;
        },
        scale: function (scaleX, scaleY) {
            var m = new Matrix();
            m.a = scaleX;
            m.b = 0;
            m.c = 0;
            m.d = scaleY;
            m.e = 0;
            m.f = 0;
            return m;
        }
    });

    // Exports ================================================================
    deepExtend(dataviz, {
        geometry: {
            Circle: Circle,
            Matrix: Matrix,
            Point: Point,
            Rect: Rect
        }
    });

})(window.kendo.jQuery);
(function () {

    // Imports ================================================================
    var $ = jQuery,
        doc = document,
        noop = $.noop,
        toString = Object.prototype.toString,

        kendo = window.kendo,
        Class = kendo.Class,
        deepExtend = kendo.deepExtend,

        dataviz = kendo.dataviz;

    // Base surface ==========================================================
    var Surface = kendo.Observable.extend({
        clear: noop,

        destroy: function() {
            this.clear();
            $(this.element).kendoDestroy();
        },

        resize: function(force) {
            var size = this.getSize(),
                currentSize = this._size;

            if (force || !currentSize ||
                size.width !== currentSize.width || size.height !== currentSize.height) {
                this._size = size;
                this._resize(size);
            }
        },

        getSize: function() {
            return {
                width: $(this.element).width(),
                height: $(this.element).height()
            };
        },

        setSize: function(size) {
            $(this.element).css({
                width: size.width,
                height: size.height
            });

            this.resize();
        },

        _resize: noop,

        _handler: function(event) {
            var surface = this;

            return function(e) {
                var node = e.target._kendoNode;
                if (node) {
                    surface.trigger(event, {
                        shape: node.srcElement,
                        originalEvent: e
                    });
                }
            };
        }
    });

    Surface.create = function(element, options, preferred) {
        return SurfaceFactory.current.create(element, options, preferred);
    };

    // Stage node ============================================================
    var BaseNode = Class.extend({
        init: function(srcElement) {
            this.childNodes = [];
            this.parent = null;

            if (srcElement) {
                this.srcElement = srcElement;
                srcElement.observer = this;
            }
        },

        load: noop,

        append: function(node) {
            this.childNodes.push(node);
            node.parent = this;
        },

        remove: function(index, count) {
            for (var i = index; i < count; i++) {
                this.childNodes[i].clear();
            }
            this.childNodes.splice(index, count);

            this.parent = null;
        },

        clear: function() {
            this.remove(0, this.childNodes.length);
        },

        invalidate: function() {
            if (this.parent) {
                this.parent.invalidate();
            }
        },

        geometryChange: function() {
            this.invalidate();
        },

        optionsChange: function() {
            this.invalidate();
        },

        childrenChange: function(e) {
            if (e.action === "add") {
                this.load(e.items);
            } else if (e.action === "remove") {
                this.remove(e.index, e.items.length);
            }

            this.invalidate();
        }
    });

    // Options storage with optional observer =============================
    var OptionsStore = Class.extend({
        init: function(value, prefix) {
            var field,
                member;

            this.observer = null;
            this.prefix = prefix || "";

            for (field in value) {
                member = value[field];
                member = this.wrap(member, field);
                this[field] = member;
            }
        },

        optionsChange: function(e) {
            if (this.observer) {
                this.observer.optionsChange(e);
            }
        },

        get: function(field) {
            return kendo.getter(field, true)(this);
        },

        set: function(field, value) {
            var current = kendo.getter(field, true)(this);

            if (current !== value) {
                var composite = this._set(field, this.wrap(value, field));
                if (this.observer && !composite) {
                    this.observer.optionsChange({
                        field: this.prefix + field,
                        value: value
                    });
                }
            }
        },

        _set: function(field, value) {
            var composite = field.indexOf(".") >= 0;

            if (composite) {
                var parts = field.split("."),
                    path = "",
                    obj;

                while (parts.length > 1) {
                    path += parts.shift();
                    obj = kendo.getter(path, true)(this);

                    if (!obj) {
                        obj = new OptionsStore({}, path + ".");
                        obj.observer = this;
                        this[path] = obj;
                    }

                    if (obj instanceof OptionsStore) {
                        obj.set(parts.join("."), value);
                        return composite;
                    }

                    path += ".";
                }
            }

            kendo.setter(field)(this, value);

            return composite;
        },

        wrap: function(object, field) {
            var type = toString.call(object);

            if (object !== null && type === "[object Object]") {
                if (!(object instanceof OptionsStore)) {
                    object = new OptionsStore(object, this.prefix + field + ".");
                }

                object.observer = this;
            }

            return object;
        }
    });

    var SurfaceFactory = function() {
        this._views = [];
    };

    SurfaceFactory.prototype = {
        register: function(name, type, order) {
            var views = this._views,
                defaultView = views[0],
                entry = {
                    name: name,
                    type: type,
                    order: order
                };

            if (!defaultView || order < defaultView.order) {
                views.unshift(entry);
            } else {
                views.push(entry);
            }
        },

        create: function(element, options, preferred) {
            var views = this._views,
                match = views[0];

            if (preferred) {
                preferred = preferred.toLowerCase();
                for (var i = 0; i < views.length; i++) {
                    if (views[i].name === preferred) {
                        match = views[i];
                        break;
                    }
                }
            }

            if (match) {
                return new match.type(element, options);
            }

            kendo.logToConsole(
                "Warning: KendoUI DataViz cannot render. Possible causes:\n" +
                "- The browser does not support SVG, VML and Canvas. User agent: " + navigator.userAgent + "\n" +
                "- The kendo.dataviz.(svg|vml|canvas).js scripts are not loaded");
        }
    };

    SurfaceFactory.current = new SurfaceFactory();

    kendo.support.svg = (function() {
        return doc.implementation.hasFeature(
            "http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
    })();

    kendo.support.canvas = (function() {
        return !!doc.createElement("canvas").getContext;
    })();

    // Exports ================================================================
    deepExtend(dataviz, {
        drawing: {
            BaseNode: BaseNode,
            OptionsStore: OptionsStore,
            Surface: Surface,
            SurfaceFactory: SurfaceFactory
        }
    });

})(window.kendo.jQuery);
(function () {

    // Imports ================================================================
    var kendo = window.kendo,
        Class = kendo.Class,
        deepExtend = kendo.deepExtend,

        dataviz = kendo.dataviz,
        append = dataviz.append,

        g = dataviz.geometry,
        Point = g.Point,

        drawing = dataviz.drawing,
        OptionsStore = drawing.OptionsStore,

        util = dataviz.util,
        defined = util.defined;

    // Drawing primitives =====================================================
    var Element = Class.extend({
        init: function(options) {
            var shape = this;

            shape.observer = null;
            shape.options = new OptionsStore(options || {});
            shape.options.observer = this;
        },

        optionsChange: function(e) {
            if (this.observer) {
                this.observer.optionsChange(e);
            }
        },

        visible: function(visible) {
            this.options.set("visible", visible);
            return this;
        }
    });

    var Group = Element.extend({
        init: function(options) {
            this.children = [];
            Element.fn.init.call(this, options);
        },

        childrenChange: function(action, items, index) {
            if (this.observer) {
                this.observer.childrenChange({
                    action: action,
                    items: items,
                    index: index
                });
            }
        },

        traverse: function(callback) {
            var children = this.children;

            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                callback(child);

                if (child.traverse) {
                    child.traverse(callback);
                }
            }
        },

        append: function() {
            append(this.children, arguments);
            this.childrenChange("add", arguments);
        },

        clear: function() {
            var items = this.children;
            this.children = [];
            this.childrenChange("remove", items, 0);
        }
    });

    var Shape = Element.extend({
        geometryChange: util.mixins.geometryChange,

        fill: function(color, opacity) {
            this.options.set("fill.color", color);

            if (defined(opacity)) {
                this.options.set("fill.opacity", opacity);
            }

            return this;
        },

        stroke: function(color, width, opacity) {
            this.options.set("stroke.color", color);

            if (defined(width)) {
               this.options.set("stroke.width", width);
            }

            if (defined(opacity)) {
               this.options.set("stroke.opacity", opacity);
            }

            return this;
        }
    });

    var Text = Shape.extend({
        init: function(content, options) {
            var text = this;
            text.content = content;

            Shape.fn.init.call(text, options);
        }
    });

    var Circle = Shape.extend({
        init: function(geometry, options) {
            var circle = this;
            Shape.fn.init.call(circle, options);

            circle.geometry = geometry || new g.Circle();
            circle.geometry.observer = this;
        }
    });

    var Segment = Class.extend({
        init: function(anchor, controlIn, controlOut) {
            var segment = this;

            segment.anchor = anchor || new Point();
            segment.anchor.observer = this;
            segment.observer = null;

            if (controlIn) {
                segment.controlIn = controlIn;
                segment.controlIn.observer = this;
            }

            if (controlOut) {
                segment.controlOut = controlOut;
                segment.controlOut.observer = this;
            }
        },

        geometryChange: util.mixins.geometryChange
    });

    var Path = Shape.extend({
        init: function(options) {
            var path = this;

            path.segments = [];
            path.observer = null;

            Shape.fn.init.call(path, options);
        },

        moveTo: function(x, y) {
            this.segments = [];
            this.lineTo(x, y);

            return this;
        },

        lineTo: function(x, y) {
            var point = defined(y) ? new Point(x, y) : x,
                segment = new Segment(point);

            segment.observer = this;

            this.segments.push(segment);
            this.geometryChange();

            return this;
        },

        close: function() {
            this.options.closed = true;
            this.geometryChange();

            return this;
        }
    });

    var MultiPath = Shape.extend({
        init: function(options) {
            this.paths = [];
            Shape.fn.init.call(this, options);
        },

        moveTo: function(x, y) {
            var path = new Path();
            path.observer = this;

            this.paths.push(path);
            path.moveTo(x, y);

            return this;
        },

        lineTo: function(x, y) {
            if (this.paths.length > 0) {
                dataviz.last(this.paths).lineTo(x, y);
            }

            return this;
        },

        close: function() {
            if (this.paths.length > 0) {
                dataviz.last(this.paths).close();
            }

            return this;
        }
    });

    // Sector
    // Ring

    // Exports ================================================================
    deepExtend(drawing, {
        Group: Group,
        Shape: Shape,

        Circle: Circle,
        Path: Path,
        MultiPath: MultiPath,
        Segment: Segment,
        Text: Text
    });

})(window.kendo.jQuery);
(function ($) {

    // Imports ================================================================
    var doc = document,

        kendo = window.kendo,
        deepExtend = kendo.deepExtend,

        dataviz = kendo.dataviz,
        defined = dataviz.defined,
        renderTemplate = dataviz.renderTemplate,

        d = dataviz.drawing,
        BaseNode = d.BaseNode,

        util = dataviz.util,
        renderAttr = util.renderAttr,
        renderAllAttr = util.renderAllAttr,
        renderSize = util.renderSize;

    // Constants ==============================================================
    var BUTT = "butt",
        DASH_ARRAYS = dataviz.DASH_ARRAYS,
        NONE = "none",
        SOLID = "solid",
        SQUARE = "square",
        SVG_NS = "http://www.w3.org/2000/svg",
        TRANSPARENT = "transparent",
        UNDEFINED = "undefined";

    // SVG rendering surface ==================================================
    var Surface = d.Surface.extend({
        init: function(container, options) {
            d.Surface.fn.init.call(this);

            this.options = deepExtend({}, this.options, options);
            this.bind(this.events, this.options);

            this._root = new RootNode();
            this._click = this._handler("click");
            this._mouseenter = this._handler("mouseenter");
            this._mouseleave = this._handler("mouseleave");

            this._appendTo(container);
        },

        options: {
            width: "100%",
            height: "100%"
        },

        events: [
            "click",
            "mouseenter",
            "mouseleave"
        ],

        translate: function(offset) {
            var viewBox = kendo.format(
                "{0} {1} {2} {3}",
                offset.x, offset.y,
                this._size.width, this._size.height);

            this._offset = offset;
            this.element.setAttribute("viewBox", viewBox);
        },

        draw: function(element) {
            this._root.load([element]);
        },

        clear: function() {
            this._root.clear();
        },

        svg: function() {
            return this._template(this);
        },

        setSize: function(size) {
            this.element.setAttribute("width", renderSize(size.width));
            this.element.setAttribute("height", renderSize(size.height));
            this.resize();
        },

        _resize: function() {
            if (this._offset) {
                this.translate(this._offset);
            }
        },

        _template: renderTemplate(
            // TODO: Append XML prefix only during export
            "<?xml version='1.0' ?>" +
            "<svg xmlns='" + SVG_NS + "' version='1.1' " +
            "width='#= kendo.dataviz.util.renderSize(d.options.width) #' " +
            "height='#= kendo.dataviz.util.renderSize(d.options.height) #' " +
            "style='position: absolute;'>#= d._root.render() #</svg>"
        ),

        _appendTo: function(container) {
            renderSVG(container, this._template(this));
            this.element = container.firstElementChild;
            alignToScreen(this.element);

            this._root.attachTo(this.element);

            var element = $(this.element);

            element.on("click", this._click);
            element.on("mouseover", this._mouseenter);
            element.on("mouseout", this._mouseleave);

            this.resize();
        }
    });

    // SVG Node ================================================================
    var Node = BaseNode.extend({
        load: function(elements) {
            var node = this,
                element = node.element,
                childNode,
                srcElement,
                children,
                i;

            for (i = 0; i < elements.length; i++) {
                srcElement = elements[i];
                children = srcElement.children;

                if (srcElement instanceof d.Group) {
                    childNode = new GroupNode(srcElement);
                } else if (srcElement instanceof d.Path) {
                    childNode = new PathNode(srcElement);
                } else if (srcElement instanceof d.MultiPath) {
                    childNode = new MultiPathNode(srcElement);
                } else if (srcElement instanceof d.Circle) {
                    childNode = new CircleNode(srcElement);
                }

                if (children && children.length > 0) {
                    childNode.load(children);
                }

                node.append(childNode);

                if (element) {
                    childNode.attachTo(element);
                }
            }
        },

        attachTo: function(domElement) {
            var container = doc.createElement("div");
            renderSVG(container,
                "<svg xmlns='" + SVG_NS + "' version='1.1'>" +
                this.render() +
                "</svg>"
            );

            var element = container.firstChild.firstChild;
            if (element) {
                domElement.appendChild(element);
                this.setElement(element);
            }
        },

        setElement: function(element) {
            var nodes = this.childNodes,
                childElement,
                i;

            if (this.element) {
                this.element._kendoNode = null;
            }

            this.element = element;
            element._kendoNode = this;

            for (i = 0; i < nodes.length; i++) {
                childElement = element.childNodes[i];
                nodes[i].setElement(childElement);
            }
        },

        template: renderTemplate(
            "#= d.renderChildren() #"
        ),

        render: function() {
            return this.template(this);
        },

        renderChildren: function() {
            var nodes = this.childNodes,
                output = "",
                i;

            for (i = 0; i < nodes.length; i++) {
                output += nodes[i].render();
            }

            return output;
        },

        clear: function() {
            var element = this.element;

            if (element) {
                element.parentNode.removeChild(element);
                this.element = null;
            }

            BaseNode.fn.clear.call(this);
        }
    });

    var RootNode = Node.extend({
        attachTo: function(domElement) {
            this.element = domElement;
        },

        clear: BaseNode.fn.clear
    });

    var GroupNode = Node.extend({
        template: renderTemplate(
            "<g>#= d.renderChildren() #</g>"
        )
    });

    var PathNode = Node.extend({
        geometryChange: function() {
            this.attr("d", this.renderData());
            this.invalidate();
        },

        optionsChange: function(e) {
            switch(e.field) {
                case "fill":
                    this.allAttr(this.mapFill(e.value));
                    break;

                case "fill.color":
                    this.allAttr(this.mapFill({ color: e.value }));
                    break;

                case "stroke":
                    this.allAttr(this.mapStroke(e.value));
                    break;

                case "visible":
                    this.attr("visibility", e.value ? "visible" : "hidden");
                    break;

                default:
                    var name = this.attributeMap[e.field];
                    if (name) {
                        this.attr(name, e.value);
                    }
                    break;
            }

            this.invalidate();
        },

        attributeMap: {
            "fill.opacity": "fill-opacity",
            "stroke.color": "stroke",
            "stroke.width": "stroke-width",
            "stroke.opacity": "stroke-opacity"
        },

        attr: function(name, value) {
            if (this.element) {
                this.element.setAttribute(name, value);
            }
        },

        allAttr: function(attrs) {
            for (var i = 0; i < attrs.length; i++) {
                this.attr(attrs[i][0], attrs[i][1]);
            }
        },

        renderData: function() {
            return this.printPath(this.srcElement);
        },

        printPath: function(path) {
            var segments = path.segments;
            if (segments.length > 0) {
                var parts = [],
                    output,
                    i;

                for (i = 0; i < segments.length; i++) {
                    parts.push(segments[i].anchor.toString(1));
                }

                output = "M" + parts.join(" ");
                if (path.options.closed) {
                    output += "Z";
                }

                return output;
            }
        },

        mapStroke: function(stroke) {
            var attrs = [];

            if (stroke) {
                attrs.push(["stroke", stroke.color]);
                attrs.push(["stroke-width", stroke.width]);
                attrs.push(["stroke-linecap", this.renderLinecap(stroke)]);

                if (defined(stroke.opacity)) {
                    attrs.push(["stroke-opacity", stroke.opacity]);
                }

                if (defined(stroke.dashType)) {
                    attrs.push(["stroke-dasharray", this.renderDashType(stroke)]);
                }
            }

            return attrs;
        },

        renderStroke: function() {
            return renderAllAttr(
                this.mapStroke(this.srcElement.options.stroke)
            );
        },

        renderDashType: function (stroke) {
            var width = stroke.width || 1,
                dashType = stroke.dashType;

            if (dashType && dashType != SOLID) {
                var dashArray = DASH_ARRAYS[dashType.toLowerCase()],
                    result = [],
                    i;

                for (i = 0; i < dashArray.length; i++) {
                    result.push(dashArray[i] * width);
                }

                return result.join(" ");
            }
        },

        renderLinecap: function(stroke) {
            var dashType = stroke.dashType,
                lineCap = stroke.lineCap || SQUARE;

            return (dashType && dashType != SOLID) ? BUTT : lineCap;
        },

        mapFill: function(fill) {
            var attrs = [];

            if (fill && fill.color !== TRANSPARENT) {
                attrs.push(["fill", fill.color]);

                if (defined(fill.opacity)) {
                    attrs.push(["fill-opacity", fill.opacity]);
                }
            } else {
                attrs.push(["fill", NONE]);
            }

            return attrs;
        },

        renderFill: function() {
            return renderAllAttr(
                this.mapFill(this.srcElement.options.fill)
            );
        },

        renderCursor: function() {
            var cursor = this.srcElement.options.cursor;

            if (cursor) {
                return "cursor:" + cursor + ";";
            }
        },

        renderVisibility: function() {
            if (this.srcElement.options.visible === false) {
                return renderAttr("visibility", "hidden");
            }

            return "";
        },

        template: renderTemplate(
            "<path #= kendo.dataviz.util.renderAttr('style', d.renderCursor()) # " +
            "#= d.renderVisibility() # " +
            "#= kendo.dataviz.util.renderAttr('d', d.renderData()) # " +
            "#= d.renderStroke() # " +
            "#= d.renderFill() # " +
            "stroke-linejoin='round'></path>"
        )
    });

    var MultiPathNode = PathNode .extend({
        renderData: function() {
            var paths = this.srcElement.paths;

            if (paths.length > 0) {
                var result = [],
                    i;

                for (i = 0; i < paths.length; i++) {
                    result.push(this.printPath(paths[i]));
                }

                return result.join(" ");
            }
        }
    });

    var CircleNode = PathNode.extend({
        geometryChange: function() {
            var geometry = this.srcElement.geometry;
            this.attr("cx", geometry.center.x);
            this.attr("cy", geometry.center.y);
            this.attr("r", geometry.radius);
            this.invalidate();
        },

        template: renderTemplate(
            "<circle #= kendo.dataviz.util.renderAttr('style', d.renderCursor()) # " +
            "cx='#= this.srcElement.geometry.center.x #' cy='#= this.srcElement.geometry.center.y #' " +
            "r='#= this.srcElement.geometry.radius #' " +
            "#= d.renderVisibility() # " +
            "#= d.renderStroke() # " +
            "#= d.renderFill() #></circle>"
        )
    });

    // Helpers ================================================================
    var renderSVG = function(container, svg) {
        container.innerHTML = svg;
    };

    (function() {
        var testFragment = "<svg xmlns='" + SVG_NS + "'></svg>",
            testContainer = doc.createElement("div"),
            hasParser = typeof DOMParser != UNDEFINED;

        testContainer.innerHTML = testFragment;

        if (hasParser && testContainer.firstChild.namespaceURI != SVG_NS) {
            renderSVG = function(container, svg) {
                var parser = new DOMParser(),
                    chartDoc = parser.parseFromString(svg, "text/xml"),
                    importedDoc = doc.adoptNode(chartDoc.documentElement);

                container.innerHTML = "";
                container.appendChild(importedDoc);
            };
        }
    })();

    function alignToScreen(element) {
        var ctm;

        try {
            ctm = element.getScreenCTM ? element.getScreenCTM() : null;
        } catch (e) { }

        if (ctm) {
            var left = - ctm.e % 1,
                top = - ctm.f % 1,
                style = element.style;

            if (left !== 0 || top !== 0) {
                style.left = left + "px";
                style.top = top + "px";
            }
        }
    }

    // Exports ================================================================

    if (kendo.support.svg) {
        d.SurfaceFactory.current.register("svg", Surface, 10);
    }

    deepExtend(d, {
        svg: {
            CircleNode: CircleNode,
            GroupNode: GroupNode,
            MultiPathNode: MultiPathNode,
            Node: Node,
            PathNode: PathNode,
            RootNode: RootNode,
            Surface: Surface
        }
    });

})(window.kendo.jQuery);
(function ($) {

    // Imports ================================================================
    var doc = document,

        kendo = window.kendo,
        deepExtend = kendo.deepExtend,

        dataviz = kendo.dataviz,
        defined = dataviz.defined,
        renderTemplate = dataviz.renderTemplate,

        d = dataviz.drawing,
        BaseNode = d.BaseNode,

        util = dataviz.util,
        renderAllAttr = util.renderAllAttr;

    // Constants ==============================================================
    var NONE = "none",
        TRANSPARENT = "transparent";

    // VML rendering surface ==================================================
    var Surface = d.Surface.extend({
        init: function(container, options) {
            d.Surface.fn.init.call(this);

            this.options = deepExtend({}, this.options, options);
            this.bind(this.events, this.options);

            this._root = new RootNode();
            this._click = this._handler("click");
            this._mouseenter = this._handler("mouseenter");
            this._mouseleave = this._handler("mouseleave");

            this._appendTo(container);
        },

        events: [
            "click",
            "mouseenter",
            "mouseleave"
        ],

        draw: function(element) {
            var surface = this;
            surface._root.load([element]);

            if (kendo.support.browser.version < 8) {
                setTimeout(function() {
                    surface.element.style.display = "block";
                }, 0);
            }
        },

        clear: function() {
            this._root.clear();

            if (kendo.support.browser.version < 8) {
                this.element.style.display = "none";
            }
        },

        _template: renderTemplate(
            "<div style='" +
                "width:#= kendo.dataviz.util.renderSize(d.options.width) #; " +
                "height:#= kendo.dataviz.util.renderSize(d.options.height) #; " +
                "position: absolute;'" +
            "><#= d._root.render() #/div>"
        ),

        _appendTo: function(container) {
            if (doc.namespaces) {
                doc.namespaces.add("kvml", "urn:schemas-microsoft-com:vml", "#default#VML");
            }

            container.innerHTML = this._template(this);
            this.element = container.firstChild;

            this._root.attachTo(this.element);

            var element = $(this.element);
            element.on("click", this._click);
            element.on("mouseover", this._mouseenter);
            element.on("mouseout", this._mouseleave);
        }
    });

    // SVG Node ================================================================
    var Node = BaseNode.extend({
        load: function(elements) {
            var node = this,
                element = node.element,
                childNode,
                srcElement,
                children,
                i;

            for (i = 0; i < elements.length; i++) {
                srcElement = elements[i];
                children = srcElement.children;

                if (srcElement instanceof d.Group) {
                    childNode = new GroupNode(srcElement);
                } else if (srcElement instanceof d.Path) {
                    childNode = new PathNode(srcElement);
                } else if (srcElement instanceof d.MultiPath) {
                    childNode = new MultiPathNode(srcElement);
                } else if (srcElement instanceof d.Circle) {
                    childNode = new CircleNode(srcElement);
                }

                if (children && children.length > 0) {
                    childNode.load(children);
                }

                node.append(childNode);

                if (element) {
                    childNode.attachTo(element);
                }
            }
        },

        attachTo: function(domElement) {
            var container = doc.createElement("div");

            container.style.display = "none";
            doc.body.appendChild(container);
            container.innerHTML = this.render();

            var element = container.firstChild;
            if (element) {
                domElement.appendChild(element);
                this.setElement(element);
            }

            doc.body.removeChild(container);
        },

        setElement: function(element) {
            var nodes = this.childNodes,
                childElement,
                i;

            if (this.element) {
                this.element._kendoNode = null;
            }

            this.element = element;
            element._kendoNode = this;

            for (i = 0; i < nodes.length; i++) {
                childElement = element.childNodes[i];
                nodes[i].setElement(childElement);
            }
        },

        template: renderTemplate(
            "#= d.renderChildren() #"
        ),

        render: function() {
            return this.template(this);
        },

        renderChildren: function() {
            var nodes = this.childNodes,
                output = "",
                i;

            for (i = 0; i < nodes.length; i++) {
                output += nodes[i].render();
            }

            return output;
        },

        clear: function() {
            var element = this.element;

            if (element) {
                element.parentNode.removeChild(element);
                this.element = null;
            }

            BaseNode.fn.clear.call(this);
        },

        attr: function(name, value) {
            if (this.element) {
                this.element[name] = value;
            }
        },

        allAttr: function(attrs) {
            for (var i = 0; i < attrs.length; i++) {
                this.attr(attrs[i][0], attrs[i][1]);
            }
        },

        css: function(name, value) {
            if (this.element) {
                this.element.style[name] = value;
            }
        }
    });

    var RootNode = Node.extend({
        attachTo: function(domElement) {
            this.element = domElement;
        },

        clear: BaseNode.fn.clear
    });

    var GroupNode = Node.extend({
        template: renderTemplate(
            "<div>#= d.renderChildren() #</div>"
        )
    });

    var StrokeNode = Node.extend({
        optionsChange: function(e) {
            if (e.field === "stroke") {
                this.allAttr(this.mapStroke(e.value));
            } else {
                var name = this.attributeMap[e.field];
                if (name) {
                    this.attr(name, e.value);
                }
            }

            this.invalidate();
        },

        attributeMap: {
            "stroke.color": "color",
            "stroke.width": "weight",
            "stroke.opacity": "opacity",
            "stroke.dashType": "dashstyle"
        },

        mapStroke: function(stroke) {
            var attrs = [];

            if (stroke) {
                attrs.push(["on", "true"]);
                attrs.push(["color", stroke.color]);
                attrs.push(["weight", stroke.width + "px"]);

                if (defined(stroke.opacity)) {
                    attrs.push(["opacity", stroke.opacity]);
                }

                if (defined(stroke.dashType)) {
                    attrs.push(["dashstyle", stroke.dashType]);
                }
            } else {
                attrs.push(["on", "false"]);
            }

            return attrs;
        },

        renderStroke: function() {
            return renderAllAttr(
                this.mapStroke(this.srcElement.options.stroke)
            );
        },

        template: renderTemplate(
            "<kvml:stroke #= d.renderStroke() #></kvml:stroke>"
        )
    });

    var FillNode = Node.extend({
        optionsChange: function(e) {
            switch(e.field) {
                case "fill":
                    this.allAttr(this.mapFill(e.value));
                    break;

                case "fill.color":
                    this.allAttr(this.mapFill({ color: e.value }));
                    break;

                default:
                    var name = this.attributeMap[e.field];
                    if (name) {
                        this.attr(name, e.value);
                    }
                    break;
            }

            this.invalidate();
        },

        attributeMap: {
            "fill.opacity": "opacity"
        },

        mapFill: function(fill) {
            var attrs = [];

            if (fill && fill.color !== TRANSPARENT) {
                attrs.push(["on", "true"]);
                attrs.push(["color", fill.color]);

                if (defined(fill.opacity)) {
                    attrs.push(["opacity", fill.opacity]);
                }
            } else {
                attrs.push(["on", "false"]);
            }

            return attrs;
        },

        renderFill: function() {
            return renderAllAttr(
                this.mapFill(this.srcElement.options.fill)
            );
        },

        template: renderTemplate(
            "<kvml:fill #= d.renderFill() #></kvml:fill>"
        )
    });

    var PathNode = Node.extend({
        init: function(srcElement) {
            this.fill = new FillNode(srcElement);
            this.stroke = new StrokeNode(srcElement);

            Node.fn.init.call(this, srcElement);

            this.append(this.fill);
            this.append(this.stroke);
        },

        geometryChange: function() {
            this.attr("v", this.renderData());
            this.invalidate();
        },

        optionsChange: function(e) {
            if (e.field === "visible") {
                this.css("display", e.value ? "block" : "none");
            } else if (e.field.indexOf("fill") === 0) {
                this.fill.optionsChange(e);
            } else if (e.field.indexOf("stroke") === 0) {
                this.stroke.optionsChange(e);
            }

            this.invalidate();
        },

        renderData: function() {
            return this.printPath(this.srcElement);
        },

        printPath: function(path, open) {
            var segments = path.segments;
            if (segments.length > 0) {
                var parts = [],
                    output,
                    i;

                for (i = 0; i < segments.length; i++) {
                    parts.push(segments[i].anchor.toString(0, ","));
                }

                output = "m " + parts.shift() + " l " + parts.join(" ");
                if (path.options.closed) {
                    output += " x";
                }

                if (open !== true) {
                    output += " e";
                }

                return output;
            }
        },

        mapFill: function(fill) {
            var attrs = [];

            if (fill && fill.color !== TRANSPARENT) {
                attrs.push(["fill", fill.color]);

                if (defined(fill.opacity)) {
                    attrs.push(["fill-opacity", fill.opacity]);
                }
            } else {
                attrs.push(["fill", NONE]);
            }

            return attrs;
        },

        renderCursor: function() {
            var cursor = this.srcElement.options.cursor;

            if (cursor) {
                return "cursor:" + cursor + ";";
            }

            return "";
        },

        renderVisibility: function() {
            if (this.srcElement.options.visible === false) {
                return "display:none;";
            }

            return "";
        },

        renderCoordsize: function() {
            var scale = this.srcElement.options.align === false ? 10000 : 1;
            return "coordsize='" + scale + " " + scale + "'";
        },

        renderSize: function() {
            var scale = this.srcElement.options.align === false ? 100 : 1;
            return "width:" + scale + "px;height:" + scale + "px;";
        },

        template: renderTemplate(
            "<kvml:shape " +
            "style='position:absolute;" +
            "#= d.renderSize() # " +
            "#= d.renderVisibility() # " +
            "#= d.renderCursor() #' " +
            "coordorigin='0 0' #= d.renderCoordsize() #>" +
                "#= d.renderChildren() #" +
                "<kvml:path #= kendo.dataviz.util.renderAttr('v', d.renderData()) # />" +
            "</kvml:shape>"
        )
    });

    var MultiPathNode = PathNode.extend({
        renderData: function() {
            var paths = this.srcElement.paths;

            if (paths.length > 0) {
                var result = [],
                    i,
                    open;

                for (i = 0; i < paths.length; i++) {
                    open = i < paths.length - 1;
                    result.push(this.printPath(paths[i], open));
                }

                return result.join(" ");
            }
        }
    });

    var CircleNode = PathNode.extend({
        geometryChange: function() {
            var radius = this.radius();
            var center = this.center();
            var diameter = radius * 2;

            this.css("left", center.x - radius + "px");
            this.css("top", center.y - radius + "px");
            this.css("width", diameter + "px");
            this.css("height", diameter + "px");
            this.invalidate();
        },

        center: function() {
            return this.srcElement.geometry.center;
        },

        radius: function() {
            return this.srcElement.geometry.radius;
        },

        template: renderTemplate(
            "<kvml:oval " +
            "style='position:absolute;" +
            "#= d.renderVisibility() #" +
            "#= d.renderCursor() #" +
            "width:#= d.radius() * 2 #px;height:#= d.radius() * 2 #px;" +
            "top:#= d.center().y - d.radius() #px;" +
            "left:#= d.center().x - d.radius() #px;'>" +
                "#= d.renderChildren() #" +
            "</kvml:oval>"
        )
    });

    // Exports ================================================================
    if (kendo.support.browser.msie) {
        d.SurfaceFactory.current.register("vml", Surface, 20);
    }

    deepExtend(d, {
        vml: {
            CircleNode: CircleNode,
            FillNode: FillNode,
            GroupNode: GroupNode,
            MultiPathNode: MultiPathNode,
            Node: Node,
            PathNode: PathNode,
            RootNode: RootNode,
            StrokeNode: StrokeNode,
            Surface: Surface
        }
    });

})(window.kendo.jQuery);
kendo_module({
    id: "dataviz.map",
    name: "Map",
    category: "dataviz",
    description: "",
    depends: [ "data", "userevents", "dataviz.core", "dataviz.svg", "dataviz.themes" ]
});

(function ($, undefined) {
    // Imports ================================================================
    var math = Math,
        max = math.max,
        min = math.min,

        kendo = window.kendo,
        Class = kendo.Class,

        dataviz = kendo.dataviz,
        deepExtend = kendo.deepExtend,

        util = dataviz.util,
        defined = util.defined,
        round = util.round,
        valueOrDefault = util.valueOrDefault;

    // Implementation =========================================================
    var Location = Class.extend({
        init: function(lat, lng) {
            if (arguments.length === 1) {
                this.lat = lat[0];
                this.lng = lat[1];
            } else {
                this.lat = lat;
                this.lng = lng;
            }
        },

        FORMAT: "{0:N6},{1:N6}",

        toArray: function() {
            return [this.lat, this.lng];
        },

        equals: function(loc) {
            return loc && loc.lat === this.lat && loc.lng === this.lng;
        },

        clone: function() {
            return new Location(this.lat, this.lng);
        },

        round: function(precision) {
            this.lng = round(this.lng, precision);
            this.lat = round(this.lat, precision);
            return this;
        },

        wrap: function() {
            this.lng = this.lng % 180;
            this.lat = this.lat % 90;
            return this;
        }
    });

    // IE < 9 doesn't allow to override toString on definition
    Location.fn.toString = function() {
        return kendo.format(this.FORMAT, this.lng, this.lat);
    };

    Location.fromLngLat = function(ll) {
        return new Location(ll[1], ll[0]);
    };

    Location.fromLatLng = function(ll) {
        return new Location(ll[0], ll[1]);
    };

    Location.create = function(arg0, arg1) {
        if (defined(arg0)) {
            if (arg0 instanceof Location) {
                return arg0.clone();
            } else if (arguments.length === 1 && arg0.length === 2) {
                return Location.fromLatLng(arg0);
            } else {
                return new Location(arg0, arg1);
            }
        }
    };

    var Extent = Class.extend({
        init: function(nw, se) {
            this.nw = Location.create(nw);
            this.se = Location.create(se);
        },

        contains: function(loc) {
            var nw = this.nw,
                se = this.se,
                lng = valueOrDefault(loc.lng, loc[1]),
                lat = valueOrDefault(loc.lat, loc[0]);

            return loc &&
                   lng + 180 >= nw.lng + 180 &&
                   lng + 180 <= se.lng + 180 &&
                   lat + 90 >= se.lat + 90 &&
                   lat + 90 <= nw.lat + 90;
        },

        center: function() {
            var nw = this.nw;
            var se = this.se;

            var lng = nw.lng + (se.lng - nw.lng) / 2;
            var lat = nw.lat + (se.lat - nw.lat) / 2;
            return new Location(lat, lng);
        },

        containsAny: function(locs) {
            var result = false;
            for (var i = 0; i < locs.length; i++) {
                result = result || this.contains(locs[i]);
            }

            return result;
        },

        include: function(loc) {
            var nw = this.nw,
                se = this.se,
                lng = valueOrDefault(loc.lng, loc[1]),
                lat = valueOrDefault(loc.lat, loc[0]);

            nw.lng = min(nw.lng, lng);
            nw.lat = max(nw.lat, lat);

            se.lng = max(se.lng, lng);
            se.lat = min(se.lat, lat);
        },

        includeAll: function(locs) {
            for (var i = 0; i < locs.length; i++) {
                this.include(locs[i]);
            }
        },

        edges: function() {
            var nw = this.nw,
                se = this.se;

            return [nw, new Location(nw.lat, se.lng),
                    se, new Location(nw.lng, se.lat)];
        },

        overlaps: function(extent) {
            return this.containsAny(extent.edges()) ||
                   extent.containsAny(this.edges());
        }
    });

    // Exports ================================================================
    deepExtend(dataviz, {
        map: {
            Extent: Extent,
            Location: Location
        }
    });

})(window.kendo.jQuery);
kendo_module({
    id: "dataviz.navigator",
    name: "Navigator",
    category: "dataviz",
    depends: [ "dataviz.core" ],
    advanced: true
});

(function ($) {
    var kendo = window.kendo;
    var Widget = kendo.ui.Widget;
    var NS = ".kendoNavigator";

    function button(dir) {
       return kendo.format(
           '<button class="k-button k-navigator-{0}">' +
               '<span class="k-icon k-i-arrow-{0}"/>' +
           '</button>', dir);
    }

    var BUTTONS = button("n") + button("e") + button("s") + button("w");

    var Navigator = Widget.extend({
        init: function(element, options) {
            Widget.fn.init.call(this, element, options);
            this._initOptions(options);

            this.element.addClass("k-widget k-header k-shadow k-navigator")
                        .append(BUTTONS)
                        .on("click" + NS, ".k-button", $.proxy(this, "_click"));
        },

        options: {
            name: "Navigator",
            panStep: 1
        },

        events: [
            "pan"
        ],

        _click: function(e) {
            var x = 0;
            var y = 0;
            var panStep = this.options.panStep;
            var button = $(e.currentTarget);

            if (button.is(".k-navigator-n")) {
                y = 1;
            } else if (button.is(".k-navigator-s")) {
                y = -1;
            } else if (button.is(".k-navigator-e")) {
                x = 1;
            } else if (button.is(".k-navigator-w")) {
                x = -1;
            }

            this.trigger("pan", {
                x: x * panStep,
                y: y * panStep
            });
        }
    });

    kendo.dataviz.ui.plugin(Navigator);
})(jQuery);
kendo_module({
    id: "dataviz.attribution",
    name: "Attribution",
    category: "dataviz",
    depends: [ "dataviz.core" ],
    advanced: true
});

(function() {
    var kendo = window.kendo,
        Widget = kendo.ui.Widget,
        template = kendo.template,

        dataviz = kendo.dataviz,
        valueOrDefault = dataviz.util.valueOrDefault;

    var Attribution = Widget.extend({
        init: function(element, options) {
            Widget.fn.init.call(this, element, options);
            this._initOptions(options);
            this.items = [];
            this.element.addClass("k-widget k-attribution");
        },

        options: {
            name: "Attribution",
            separator: "&nbsp;|&nbsp;",
            itemTemplate: "#= text #"
        },

        filter: function(extent, zoom) {
            this._extent = extent;
            this._zoom = zoom;
            this._render();
        },

        add: function(item) {
            if (item) {
                if (typeof item === "string") {
                    item = { text: item };
                }

                this.items.push(item);
                this._render();
            }
        },

        remove: function(text) {
            var result = [];
            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
                if (item.text !== text) {
                    result.push(item);
                }
            }

            this.items = result;

            this._render();
        },

        clear: function() {
            this.items = [];
            this.element.empty();
        },

        _render: function() {
            var result = [];
            this.element.empty();
            var itemTemplate = template(this.options.itemTemplate);

            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
                var text = this._itemText(item);
                if (text !== "") {
                    result.push(itemTemplate({
                        text: text
                    }));
                }
            }

            this.element.append(result.join(this.options.separator));
        },

        _itemText: function(item) {
            var text = "";
            var inZoomLevel = this._inZoomLevel(item.minZoom, item.maxZoom);
            var inArea = this._inArea(item.extent);

            if (inZoomLevel && inArea) {
                text += item.text;
            }

            return text;
        },

        _inZoomLevel: function(min, max) {
            var result = true;
            min = valueOrDefault(min, -Number.MAX_VALUE);
            max = valueOrDefault(max, Number.MAX_VALUE);

            result = this._zoom > min && this._zoom < max;

            return result;
        },

        _inArea: function(area) {
            var result = true;

            if (area) {
                result = area.contains(this._extent);
            }

            return result;
        }
    });

    kendo.dataviz.ui.plugin(Attribution);
})(jQuery);
kendo_module({
    id: "dataviz.zoomControl",
    name: "ZoomControl",
    category: "dataviz",
    depends: [ "dataviz.core" ],
    advanced: true
});

(function ($) {
    var kendo = window.kendo;
    var Widget = kendo.ui.Widget;
    var NS = ".kendoZoomControl";

    function button(dir, symbol) {
       return kendo.format(
           '<button class="k-button k-zoom-{0}" title="zoom-{0}">{1}</button>',
           dir, symbol);
    }

    var BUTTONS = button("in", "+") + button("out", "-");

    var ZoomControl = Widget.extend({
        init: function(element, options) {
            Widget.fn.init.call(this, element, options);
            this._initOptions(options);

            this.element.addClass("k-widget k-zoom-control k-button-wrap k-buttons-horizontal")
                        .append(BUTTONS)
                        .on("click" + NS, ".k-button", $.proxy(this, "_click"));
        },

        options: {
            name: "ZoomControl",
            zoomStep: 1
        },

        events: [
            "change"
        ],

        _click: function(e) {
            var zoomStep = this.options.zoomStep;
            var button = $(e.currentTarget);
            var dir = 1;

            if (button.is(".k-zoom-out")) {
                dir = -1;
            }

            this.trigger("change", {
                delta: dir * zoomStep
            });
        }
    });

    kendo.dataviz.ui.plugin(ZoomControl);
})(jQuery);
(function ($, undefined) {
    // Imports ================================================================
    var math = Math,
        atan = math.atan,
        exp = math.exp,
        pow = math.pow,
        sin = math.sin,
        log = math.log,
        tan = math.tan,

        kendo = window.kendo,
        Class = kendo.Class,

        dataviz = kendo.dataviz,
        Matrix = dataviz.Matrix,
        deepExtend = kendo.deepExtend,

        g = dataviz.geometry,
        Point = g.Point,

        map = dataviz.map,
        Location = map.Location,

        util = dataviz.util,
        rad = util.rad,
        deg = util.deg,
        limit = util.limitValue;

    // Constants ==============================================================
    var PI = math.PI,
        PI_DIV_2 = PI / 2,
        PI_DIV_4 = PI / 4,
        DEG_TO_RAD = PI / 180;

    // Coordinate reference systems ===========================================
    var WGS84 = {
        a: 6378137,                 // Semi-major radius
        b: 6356752.314245179,       // Semi-minor radius
        f: 0.0033528106647474805,   // Flattening
        e: 0.08181919084262149      // Eccentricity
    };

    // WGS 84 / World Mercator
    var Mercator = Class.extend({
        init: function(options) {
            this._initOptions(options);
        },

        MAX_LNG: 180,
        MAX_LAT: 85.0840590501,
        INVERSE_ITERATIONS: 15,
        INVERSE_CONVERGENCE: 1e-12,

        options: {
            centralMeridian: 0,
            datum: WGS84
        },

        forward: function(loc, clamp) {
            var proj = this,
                options = proj.options,
                datum = options.datum,
                r = datum.a,
                lng0 = options.centralMeridian,
                lat = limit(loc.lat, -proj.MAX_LAT, proj.MAX_LAT),
                lng = clamp ? limit(loc.lng, -proj.MAX_LNG, proj.MAX_LNG) : loc.lng,
                x = rad(lng - lng0) * r,
                y = proj._projectLat(lat);

            return new Point(x, y);
        },

        _projectLat: function(lat) {
            var datum = this.options.datum,
                ecc = datum.e,
                r = datum.a,
                y = rad(lat),
                ts = tan(PI_DIV_4 + y / 2),
                con = ecc * sin(y),
                p = pow((1 - con) / (1 + con), ecc / 2);

            // See:
            // http://en.wikipedia.org/wiki/Mercator_projection#Generalization_to_the_ellipsoid
            return r * log(ts * p);
        },

        inverse: function(point, clamp) {
            var proj = this,
                options = proj.options,
                datum = options.datum,
                r = datum.a,
                lng0 = options.centralMeridian,
                lng = point.x / (DEG_TO_RAD * r) + lng0,
                lat = limit(proj._inverseY(point.y), -proj.MAX_LAT, proj.MAX_LAT);

            if (clamp) {
                lng = limit(lng, -proj.MAX_LNG, proj.MAX_LNG);
            }

            return new Location(lat, lng);
        },

        _inverseY: function(y) {
            var proj = this,
                datum = proj.options.datum,
                r = datum.a,
                ecc = datum.e,
                ecch = ecc / 2,
                ts = exp(-y / r),
                phi = PI_DIV_2 - 2 * atan(ts),
                i;

            for (i = 0; i <= proj.INVERSE_ITERATIONS; i++) {
                var con = ecc * sin(phi),
                    p = pow((1 - con) / (1 + con), ecch),
                    dphi = PI_DIV_2 - 2 * atan(ts * p) - phi;

                phi += dphi;

                if (math.abs(dphi) <= proj.INVERSE_CONVERGENCE) {
                    break;
                }
            }

            return deg(phi);
        }
    });

    // WGS 84 / Pseudo-Mercator
    // Used by Google Maps, Bing, OSM, etc.
    // Spherical projection of ellipsoidal coordinates.
    var SphericalMercator = Mercator.extend({
        MAX_LAT: 85.0511287798,

        _projectLat: function(lat) {
            var r = this.options.datum.a,
                y = rad(lat),
                ts = tan(PI_DIV_4 + y / 2);

            return r * log(ts);
        },

        _inverseY: function(y) {
            var r = this.options.datum.a,
                ts = exp(-y / r);

            return deg(PI_DIV_2 - (2 * atan(ts)));
        }
    });

    var Equirectangular = Class.extend({
        forward: function(loc) {
            return new Point(loc.lng, loc.lat);
        },

        inverse: function(point) {
            return new Location(point.y, point.x);
        }
    });

    // TODO: Better (less cryptic name) for this class(es)
    var EPSG3857 = Class.extend({
        init: function() {
            var crs = this,
                proj = crs._proj = new SphericalMercator();

            var c = this.c = 2 * PI * proj.options.datum.a;

            // Scale circumference to 1, mirror Y and shift origin to top left
            this._tm = Matrix.translate(0.5, 0.5).times(Matrix.scale(1/c, -1/c));

            // Inverse transform matrix
            this._itm = Matrix.scale(c, -c).times(Matrix.translate(-0.5, -0.5));
        },

        // Location <-> Point (screen coordinates for a given scale)
        toPoint: function(loc, scale, clamp) {
            var point = this._proj.forward(loc, clamp);

            return point
                .transform(this._tm)
                .multiply(scale || 1);
        },

        toLocation: function(point, scale, clamp) {
            point = point
                .clone()
                .multiply(1 / (scale || 1))
                .transform(this._itm);

            return this._proj.inverse(point, clamp);
        }
    });

    var EPSG3395 = Class.extend({
        init: function() {
            this._proj = new Mercator();
        },

        toPoint: function(loc) {
            return this._proj.forward(loc);
        },

        toLocation: function(point) {
            return this._proj.inverse(point);
        }
    });

    // WGS 84
    var EPSG4326 = Class.extend({
        init: function() {
            this._proj = new Equirectangular();
        },

        toPoint: function(loc) {
            return this._proj.forward(loc);
        },

        toLocation: function(point) {
            return this._proj.inverse(point);
        }
    });

    // Exports ================================================================
    deepExtend(dataviz, {
        map: {
            crs: {
                EPSG3395: EPSG3395,
                EPSG3857: EPSG3857,
                EPSG4326: EPSG4326
            },
            datums: {
                WGS84: WGS84
            },
            projections: {
                Equirectangular: Equirectangular,
                Mercator: Mercator,
                SphericalMercator: SphericalMercator
            }
        }
    });

})(window.kendo.jQuery);
(function ($, undefined) {
    // Imports ================================================================
    var proxy = $.proxy,

        kendo = window.kendo,
        Class = kendo.Class,
        DataSource = kendo.data.DataSource,

        dataviz = kendo.dataviz,
        deepExtend = kendo.deepExtend,
        last = dataviz.last,

        g = dataviz.geometry,

        d = dataviz.drawing,
        Group = d.Group,

        map = dataviz.map,
        Location = map.Location;

    // Implementation =========================================================
    var ShapeLayer = Class.extend({
        init: function(map, options) {
            this._initOptions(options);
            this.map = map;

            this.element = $("<div class='k-layer'></div>")
                .appendTo(map.scrollElement);

            this.surface = d.Surface.create(this.element[0], {
                width: map.scrollElement.width(),
                height: map.scrollElement.height()
            });

            this.movable = new kendo.ui.Movable(this.surface.element);
            this._markers = [];

            this._click = this._handler("shapeClick");
            this.surface.bind("click", this._click);

            this._mouseenter = this._handler("shapeMouseEnter");
            this.surface.bind("mouseenter", this._mouseenter);

            this._mouseleave = this._handler("shapeMouseLeave");
            this.surface.bind("mouseleave", this._mouseleave);

            map.bind("reset", proxy(this.reset, this));
            map.bind("resize", proxy(this.resize, this));
            map.bind("panEnd", proxy(this._panEnd, this));

            this._loader = new GeoJSONLoader(this.map, this.options.style, this);
            this._initDataSource();

            this._updateAttribution();
        },

        options: {
            autoBind: true,
            dataSource: {}
        },

        _updateAttribution: function() {
            var attr = this.map.attribution;

            if (attr) {
                attr.add(this.options.attribution);
            }
        },

        reset: function() {
            if (this.surface.translate) {
                this.surface.translate({ x: 0, y: 0 });
            }

            this.movable.moveTo({ x: 0, y: 0 });

            if (this._data) {
                this._load(this._data);
            }
        },

        resize: function() {
            this.surface.setSize(
                this.map.getSize()
            );
        },

        polygon: function(coords, style) {
            this.surface.draw(this._buildPolygon(coords, style));
        },

        _initDataSource: function() {
            var dsOptions = this.options.dataSource;
            this._dataChange = proxy(this._dataChange, this);
            this.dataSource = DataSource
                .create(dsOptions)
                .bind("change", this._dataChange);

            if (dsOptions && this.options.autoBind) {
                this.dataSource.fetch();
            }
        },

        _dataChange: function(data) {
            this._load(data.items);
        },

        _load: function(data) {
            this._data = data;
            this._clearMarkers();
            this.surface.clear();

            for (var i = 0; i < data.length; i++) {
                var shape = this._loader.parse(data[i]);
                if (shape) {
                    this.surface.draw(shape);
                }
            }
        },

        shapeCreated: function(shape) {
            var cancelled = false;
            if (shape instanceof d.Circle) {
                cancelled = !this._createMarker(shape);
            }

            if (!cancelled) {
                var args = { layer: this, shape: shape };
                cancelled = this.map.trigger("shapeCreated", args);
            }

            return cancelled;
        },

        _createMarker: function(shape) {
            var dataItem = shape.dataItem;
            var marker = map.Marker.create({
               location: shape.location.toArray()
            }, this.map.options.markerDefaults);
            marker.dataItem = dataItem;

            var args = { marker: marker };
            var cancelled = this.map.trigger("markerCreated", args);
            if (!cancelled) {
                this.map.markers.add(marker);
                this._markers.push(marker);
            }

            return cancelled;
        },

        _clearMarkers: function() {
            for (var i = 0; i < this._markers.length; i++) {
                this.map.markers.remove(this._markers[i]);
            }
            this._markers = [];
        },

        _panEnd: function() {
            var map = this.map;
            var nw = map.locationToView(map.extent().nw);

            if (this.surface.translate) {
                this.surface.translate(nw);
                this.movable.moveTo(nw);
            }
        },

        _handler: function(event) {
            var layer = this;
            return function(e) {
                if (e.shape) {
                    var args = {
                        layer: layer,
                        shape: e.shape,
                        originalEvent: e.originalEvent
                    };

                    layer.map.trigger(event, args);
                }
            };
        }
    });

    var GeoJSONLoader = Class.extend({
        init: function(locator, defaultStyle, observer) {
            this.observer = observer;
            this.locator = locator;
            this.style = defaultStyle;
        },

        parse: function(item) {
            var root = new Group();

            if (item.type === "Feature") {
                this._loadGeometryTo(root, item.geometry, item);
            } else {
                this._loadGeometryTo(root, item, item);
            }

            if (root.children.length < 2) {
                root = root.children[0];
            }

            return root;
        },

        _shapeCreated: function(shape) {
            var cancelled = false;

            if (this.observer && this.observer.shapeCreated) {
                cancelled = this.observer.shapeCreated(shape);
            }

            return cancelled;
        },

        _loadGeometryTo: function(container, geometry, dataItem) {
            var coords = geometry.coordinates;
            var i;
            var path;

            switch(geometry.type) {
                case "LineString":
                    path = this._loadPolygon(container, [coords], dataItem);
                    this._setLineFill(path);
                    break;

                case "MultiLineString":
                    for (i = 0; i < coords.length; i++) {
                        path = this._loadPolygon(container, [coords[i]], dataItem);
                        this._setLineFill(path);
                    }
                    break;

                case "Polygon":
                    this._loadPolygon(container, coords, dataItem);
                    break;

                case "MultiPolygon":
                    for (i = 0; i < coords.length; i++) {
                        this._loadPolygon(container, coords[i], dataItem);
                    }
                    break;

                case "Point":
                    this._loadPoint(container, coords, dataItem);
                    break;

                case "MultiPoint":
                    for (i = 0; i < coords.length; i++) {
                        this._loadPoint(container, coords[i], dataItem);
                    }
                    break;
            }
        },

        _setLineFill: function(path) {
            var segments = path.segments;
            if (segments.length < 4 || !segments[0].anchor.equals(last(segments).anchor)) {
                path.options.fill = null;
            }
        },

        _loadShape: function(container, shape) {
            if (!this._shapeCreated(shape)) {
                container.append(shape);
            }

            return shape;
        },

        _loadPolygon: function(container, rings, dataItem) {
            var shape = this._buildPolygon(rings);
            shape.dataItem = dataItem;

            return this._loadShape(container, shape);
        },

        _buildPolygon: function(rings) {
            var type = rings.length > 1 ? d.MultiPath : d.Path;
            var path = new type(this.style);

            for (var i = 0; i < rings.length; i++) {
                for (var j = 0; j < rings[i].length; j++) {
                    var point = this.locator.locationToView(
                        Location.fromLngLat(rings[i][j])
                    );

                    if (j === 0) {
                        path.moveTo(point.x, point.y);
                    } else {
                        path.lineTo(point.x, point.y);
                    }
                }
            }

            return path;
        },

        _loadPoint: function(container, coords, dataItem) {
            var location = Location.fromLngLat(coords);
            var point = this.locator.locationToView(location);

            var circle = new g.Circle(point, 10);
            var shape = new d.Circle(circle, this.style);
            shape.dataItem = dataItem;
            shape.location = location;

            return this._loadShape(container, shape);
        }
    });

    // Exports ================================================================
    deepExtend(kendo.data, {
        schemas: {
            geojson: {
                type: "json",
                data: function(data) {
                    if (data.type === "FeatureCollection") {
                        return data.features;
                    }

                    if (data.type === "GeometryCollection") {
                        return data.geometries;
                    }

                    return data;
                }
            }
        },
        transports: {
            geojson: {
                read: {
                    dataType: "json"
                }
            }
        }
    });

    deepExtend(dataviz, {
        map: {
            layers: {
                shape: ShapeLayer,
                ShapeLayer: ShapeLayer
            },
            GeoJSONLoader: GeoJSONLoader
        }
    });

})(window.kendo.jQuery);
(function ($, undefined) {
    // Imports ================================================================
    var math = Math,

        proxy = $.proxy,

        kendo = window.kendo,
        Class = kendo.Class,
        template = kendo.template,

        dataviz = kendo.dataviz,
        round = dataviz.round,
        deepExtend = kendo.deepExtend,

        g = dataviz.geometry,
        Point = g.Point,

        Extent = dataviz.map.Extent,
        Location = dataviz.map.Location,

        util = dataviz.util,
        renderSize = util.renderSize,
        limit = util.limitValue;

    // Constants ==============================================================
    var DEFAULT_WIDTH = 600,
        DEFAULT_HEIGHT = 400;

    // Image tile layer =============================================================
    var TileLayer = Class.extend({
        init: function(map, options) {
            var layer = this,
                viewType = layer._viewType();

            options = deepExtend({}, options, {
                width: map.element.width() || DEFAULT_WIDTH,
                height: map.element.height() || DEFAULT_HEIGHT
            });

            layer._initOptions(options);
            layer.map = map;

            layer.element = $("<div class='k-layer'></div>")
                           .css({
                               "zIndex": layer.options.zIndex,
                               "opacity": layer.options.opacity
                           })
                           .appendTo(map.scrollElement);

            if (typeof layer.options.subdomains === "string") {
                layer.options.subdomains = layer.options.subdomains.split("");
            }

            layer._view = new viewType(layer.element, layer.options);

            map.bind("reset", proxy(layer.reset, layer));
            map.bind("resize", proxy(this.resize, layer));
            if (kendo.support.mobileOS) {
                map.bind("panEnd", proxy(layer._render, layer));
            } else {
                map.bind("pan", proxy(layer._pan, layer));
            }

            this._updateAttribution();
        },

        _updateAttribution: function() {
            var attr = this.map.attribution;

            if (attr) {
                attr.add(this.options.attribution);
            }
        },

        _viewType: function() {
            return TileView;
        },

        _updateView: function() {
            var view = this._view,
                map = this.map,
                extent = map.extent(),
                extentToPoint = {
                    nw: map.locationToLayer(extent.nw).round(),
                    se: map.locationToLayer(extent.se).round()
                };

            view.center(map.locationToLayer(map.center()));
            view.extent(extentToPoint);
            view.zoom(map.zoom());
        },

        destroy: function() {
            this._view.destroy();
            this._view = null;
        },

        reset: function() {
            this._updateView();
            this._view.clear();
            this._view.reset();
        },

        resize: function() {
            this._render();
        },

        _pan: function() {
            var layer = this,
                now = new Date(),
                timestamp = layer._pan.timestamp;

            if (!timestamp || now - timestamp > 100) {
                this._render();
                layer._pan.timestamp = now;
            }
        },

        _render: function() {
            this._updateView();
            this._view.render();
        }
    });

    var BingLayer = TileLayer.extend({
        init: function(map, options) {
            this._initOptions(options);

            var settingsTemplate = template(this.options.settingsUrl),
                settingsUrl = settingsTemplate({
                    key: this.options.key,
                    mapType: this.options.mapType
                });

            this.map = map;

            $.ajax({
                url: settingsUrl,
                type: "get",
                dataType: "jsonp",
                jsonpCallback: "bingTileParams",
                success: proxy(this._success, this)
            });
        },

        options: {
            settingsUrl: "http://dev.virtualearth.net/REST/v1/Imagery/Metadata/#= mapType #?output=json&jsonp=bingTileParams&include=ImageryProviders&key=#= key #",
            mapType: "road"
        },

        _success: function(data) {
            if (data && data.resourceSets.length) {
                var resource = this.resource = data.resourceSets[0].resources[0];

                TileLayer.fn.init.call(this, this.map, {
                    urlTemplate: resource.imageUrl
                        .replace("{subdomain}", "#= subdomain #")
                        .replace("{quadkey}", "#= quadkey #")
                        .replace("{culture}", "#= culture #"),
                    subdomains: resource.imageUrlSubdomains,
                    maxZoom: resource.zoomMax,
                    minZoom: resource.zoomMin
                });

                this._addAttribution();
                this.reset();
            }
        },

        _viewType: function() {
            return BingView;
        },

        _addAttribution: function() {
            var attr = this.map.attribution;
            if (attr) {
                var items = this.resource.imageryProviders;
                if (items) {
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        for (var y = 0; y < item.coverageAreas.length; y++) {
                            var area = item.coverageAreas[y];
                            attr.add({
                                text: item.attribution,
                                minZoom: area.zoomMin,
                                maxZoom: area.zoomMax,
                                extent: new Extent(
                                    new Location(area.bbox[2], area.bbox[1]),
                                    new Location(area.bbox[0], area.bbox[3])
                                )
                            });
                        }
                    }
                }
            }
        }
    });

    var TileView = Class.extend({
        init: function(element, options) {
            this.element = element;
            this._initOptions(options);

            this.pool = new TilePool();
        },

        options: {
            tileSize: 256,
            subdomains: ["a", "b", "c"],
            urlTemplate: ""
        },

        center: function(center) {
            this._center = center;
        },

        extent: function(extent) {
            this._extent = extent;
        },

        zoom: function(zoom) {
            this._zoom = zoom;
        },

        pointToTileIndex: function(point) {
            return new Point(
                math.floor(point.x / this.options.tileSize),
                math.floor(point.y / this.options.tileSize)
            );
        },

        clear: function() {
            this.pool.empty();
        },

        tileCount: function() {
            var size = this.size(),
                firstTileIndex = this.pointToTileIndex(this._extent.nw),
                point = this.indexToPoint(firstTileIndex).subtract(this._extent.nw);

            return {
                x: math.ceil((math.abs(point.x) + size.width) / this.options.tileSize),
                y: math.ceil((math.abs(point.y) + size.height) / this.options.tileSize)
            };
        },

        size: function() {
            var nw = this._extent.nw,
                se = this._extent.se,
                diff = se.clone().subtract(nw);

            return {
                width: diff.x,
                height: diff.y
            };
        },

        indexToPoint: function(index) {
            var x = index.x, y = index.y;

            return new Point(
                x * this.options.tileSize,
                y * this.options.tileSize
            );
        },

        subdomainText: function() {
            var subdomains = this.options.subdomains;

            return subdomains[this.subdomainIndex++ % subdomains.length];
        },

        destroy: function() {
            this.element.empty();
            this.pool.empty();
        },

        reset: function() {
            this.subdomainIndex = 0;
            this.basePoint = this._extent.nw;
            this.render();
        },

        render: function() {
            var size = this.tileCount(),
                firstTileIndex = this.pointToTileIndex(this._extent.nw),
                tile, x, y;

            for (x = 0; x < size.x; x++) {
                for (y = 0; y < size.y; y++) {
                    tile = this.createTile({
                        x: firstTileIndex.x + x,
                        y: firstTileIndex.y + y
                    });

                    if (!tile.options.visible) {
                        this.element.append(tile.element);
                        tile.options.visible = true;
                    }
                }
            }
        },

        createTile: function(currentIndex) {
            var options = this.tileOptions(currentIndex);

            return this.pool.get(this._center, options);
        },

        tileOptions: function(currentIndex) {
            var index = this.wrapIndex(currentIndex),
                point = this.indexToPoint(currentIndex),
                offset = point.clone().subtract(this.basePoint);

            return {
                index: index,
                currentIndex: currentIndex,
                point: point,
                offset: roundPoint(offset),
                zoom: this._zoom,
                subdomain: this.subdomainText(),
                urlTemplate: this.options.urlTemplate,
                errorUrlTemplate: this.options.errorUrlTemplate
            };
        },

        wrapIndex: function(index) {
            var boundary = math.pow(2, this._zoom);
            return {
                x: this.wrapValue(index.x, boundary),
                y: limit(index.y, 0, boundary - 1)
            };
        },

        wrapValue: function(value, boundary) {
            var remainder = (math.abs(value) % boundary);
            if (value >= 0) {
                value = remainder;
            } else {
                value = boundary - (remainder === 0 ? boundary : remainder);
            }

            return value;
        }
    });

    var BingView = TileView.extend({
        options: {
            culture: "en-Us"
        },

        tileOptions: function(currentIndex) {
            var options = TileView.fn.tileOptions.call(this, currentIndex);

            options.culture = this.options.culture;
            options.quadkey = this.tileQuadKey(this.wrapIndex(currentIndex));

            return options;
        },

        tileQuadKey: function(index) {
            var quadKey = "",
                digit, mask, i;

            for (i = this._zoom; i > 0; i--) {
                digit = 0;
                mask = 1 << (i - 1);

                if ((index.x & mask) !== 0) {
                    digit++;
                }

                if ((index.y & mask) !== 0) {
                    digit += 2;
                }

                quadKey += digit;
            }

            return quadKey;
        }
    });

    var ImageTile = Class.extend({
        init: function(options) {
            this._initOptions(options);
            this.createElement();
            this.load();
            // initially the image should be
            this.options.visible = false;
        },

        options: {
            urlTemplate: "",
            errorUrlTemplate: "",
            visible: false
        },

        createElement: function() {
            this.element = $("<img style='position: absolute; display: block; visibility: visible;' unselectable='on'></img>")
                            .error(proxy(function(e) {
                                e.target.setAttribute("src", this.errorUrl());
                            }, this));
        },

        load: function(options) {
            this.options = deepExtend({}, this.options, options);

            var htmlElement = this.element[0];

            htmlElement.style.visibility = "visible";
            htmlElement.style.display = "block";
            htmlElement.style.top = renderSize(this.options.offset.y);
            htmlElement.style.left = renderSize(this.options.offset.x);
            htmlElement.setAttribute("src", this.url());

            this.options.id = tileId(this.options.currentIndex, this.options.zoom);
            this.options.visible = true;
        },

        url: function() {
            var urlResult = template(this.options.urlTemplate);

            return urlResult(this.urlOptions());
        },

        errorUrl: function() {
            var urlResult = template(this.options.errorUrlTemplate);

            return urlResult(this.urlOptions());
        },

        urlOptions: function() {
            var options = this.options;
            return {
                zoom: options.zoom,
                subdomain: options.subdomain,
                z: options.zoom,
                x: options.index.x,
                y: options.index.y,
                s: options.subdomain,
                quadkey: options.quadkey,
                q: options.quadkey,
                culture: options.culture,
                c: options.culture
            };
        },

        destroy: function() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }
    });

    var TilePool = Class.extend({
        init: function() {
            // calculate max size automaticaly
            this._items = [];
        },

        options: {
            maxSize: 100
        },

        // should considered to remove the center of the screen
        get: function(center, options) {
            var pool = this,
                item;

            if (pool._items.length >= pool.options.maxSize) {
                item = pool._update(center, options);
            } else {
                item = pool._create(options);
            }

            return item;
        },

        empty: function() {
            var items = this._items,
                i;

            for (i = 0; i < items.length; i++) {
                items[i].destroy();
            }

            this._items = [];
        },

        _create: function(options) {
            var pool = this,
                items = pool._items,
                id = tileId(options.currentIndex, options.zoom),
                oldTile, i, item, tile;

            for (i = 0; i < items.length; i++) {
                item = items[i];
                if (item.options.id === id) {
                    oldTile = item;
                    tile = oldTile;
                }
            }

            if (oldTile) {
                oldTile.load(options);
            } else {
                tile = new ImageTile(options);
                this._items.push(tile);
            }

            return tile;
        },

        _update: function(center, options) {
            var pool = this,
                items = pool._items,
                dist = -Number.MAX_VALUE,
                currentDist, index, i, item;

            var id = tileId(options.currentIndex, options.zoom);

            for (i = 0; i < items.length; i++) {
                item = items[i];
                currentDist = item.options.point.clone().distanceTo(center);
                if (item.options.id === id) {
                    return items[i];
                }

                if (dist < currentDist) {
                    index = i;
                    dist = currentDist;
                }
            }

            items[index].load(options);

            return items[index];
        }
    });

    // Methods ================================================================
    function roundPoint(point) {
        return new Point(round(point.x), round(point.y));
    }

    function tileId(index, zoom) {
            return "x:" + index.x + "y:" + index.y + "zoom:" + zoom;
    }

    // Exports ================================================================
    deepExtend(dataviz, {
        map: {
            layers: {
                tile: TileLayer,
                TileLayer: TileLayer,

                bing: BingLayer,
                BingLayer: BingLayer,

                ImageTile: ImageTile,
                TilePool: TilePool,
                TileView: TileView,
                BingView: BingView
            }
        }
    });

})(window.kendo.jQuery);
(function ($, undefined) {
    // Imports ================================================================
    var doc = document,
        math = Math,
        indexOf = $.inArray,
        proxy = $.proxy,

        kendo = window.kendo,
        Class = kendo.Class,
        Tooltip = kendo.ui.Tooltip,

        dataviz = kendo.dataviz,
        deepExtend = kendo.deepExtend,

        map = dataviz.map,
        Location = map.Location;

    // Implementation =========================================================
    var MarkerLayer = Class.extend({
        init: function(map, options) {
            this._initOptions(options);

            this.items = [];
            this.map = map;
            this.element = $("<div class='k-layer'></div>")
                            .css("zIndex", this.options.zIndex)
                            .appendTo(map.scrollElement);

            this.reset = proxy(this.reset, this);
            map.bind("reset", this.reset);
        },

        destroy: function() {
            this.map.unbind("reset", this.reset);
            this.clear();
        },

        options: {
            zIndex: 1000
        },

        add: function(arg) {
            if ($.isArray(arg)) {
                for (var i = 0; i < arg.length; i++) {
                    this._addOne(arg[i]);
                }
            } else {
                return this._addOne(arg);
            }
        },

        _addOne: function(arg) {
            var marker = Marker.create(arg, this.options.markerDefaults);
            marker.addTo(this);

            return marker;
        },

        remove: function(marker) {
            marker.destroy();

            var index = indexOf(marker, this.items);
            if (index > -1) {
                this.items.splice(index, 1);
            }
        },

        clear: function() {
            for (var i = 0; i < this.items.length; i++) {
                this.items[i].destroy();
            }

            this.items = [];
        },

        update: function(marker) {
            // TODO: Do not show markers outside the map extent
            var loc = marker.options.location;
            if (loc) {
                loc = Location.create(loc);
                marker.showAt(this.map.locationToView(loc));
            }
        },

        reset: function() {
            var items = this.items;
            for (var i = 0; i < items.length; i++) {
                this.update(items[i]);
            }
        }
    });

    var Marker = Class.extend({
        init: function(options) {
            this.options = options || {};
        },

        addTo: function(parent) {
            this.layer = parent.markers || parent;
            this.layer.items.push(this);
            this.layer.update(this);
        },

        setLocation: function(loc) {
            this.options.location = Location.create(loc);

            if (this.layer) {
                this.layer.update(this);
            }
        },

        showAt: function(point) {
            this.render();
            this.element.css({
                left: math.round(point.x),
                top: math.round(point.y)
            });

            if (this.tooltip && this.tooltip.popup) {
                // TODO: Expose popup/tooltip updatePosition? method
                this.tooltip.popup._position();
            }
        },

        hide: function() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }

            if (this.tooltip) {
                this.tooltip.destroy();
                this.tooltip = null;
            }
        },

        destroy: function() {
            this.layer = null;
            this.hide();
        },

        render: function() {
            if (!this.element) {
                var options = this.options;
                var layer = this.layer;

                this.element = $(doc.createElement("span"))
                    .addClass("k-marker k-marker-" + kendo.toHyphens(options.shape || "pin"))
                    .attr("alt", options.title)
                    .css("zIndex", options.zIndex);

                if (layer) {
                    layer.element.append(this.element);
                }

                this.renderTooltip();
            }
        },

        renderTooltip: function() {
            var marker = this;
            var options = marker.options.tooltip;

            if (options && Tooltip) {
                var template = options.template;
                if (template) {
                    var contentTemplate = kendo.template(template);
                    options.content = function(e) {
                        e.location = Location.create(marker.options.location);
                        e.marker = marker;
                        return contentTemplate(e);
                    };
                }

                if (options.content || options.contentUrl) {
                    this.tooltip = new Tooltip(this.element, options);
                    this.tooltip.marker = this;
                }
            }
        }
    });

    Marker.create = function(arg, defaults) {
        if (arg instanceof Marker) {
            return arg;
        }

        return new Marker(deepExtend({}, defaults, arg));
    };

    // Exports ================================================================
    deepExtend(dataviz, {
        map: {
            layers: {
                marker: MarkerLayer,
                MarkerLayer: MarkerLayer
            },
            Marker: Marker
        }
    });

})(window.kendo.jQuery);
kendo_module({
    id: "dataviz.map",
    name: "Map",
    category: "dataviz",
    description: "The Kendo DataViz Map displays spatial data",
    depends: [ "data", "userevents", "tooltip", "dataviz.core", "mobile.scroller" ]
});

(function ($, undefined) {
    // Imports ================================================================
    var doc = document,
        math = Math,
        min = math.min,
        pow = math.pow,

        proxy = $.proxy,

        kendo = window.kendo,
        Widget = kendo.ui.Widget,
        deepExtend = kendo.deepExtend,

        dataviz = kendo.dataviz,
        Attribution = dataviz.ui.Attribution,
        Navigator = dataviz.ui.Navigator,
        ZoomControl = dataviz.ui.ZoomControl,
        defined = dataviz.defined,

        g = dataviz.geometry,

        map = dataviz.map,
        Extent = map.Extent,
        Location = map.Location,
        EPSG3857 = map.crs.EPSG3857,

        util = dataviz.util,
        limit = util.limitValue,
        renderPos = util.renderPos,
        valueOrDefault = util.valueOrDefault;

    // Constants ==============================================================
    var CSS_PREFIX = "k-",
        FRICTION = 0.90,
        FRICTION_MOBILE = 0.93,
        MOUSEWHEEL = "DOMMouseScroll mousewheel",
        VELOCITY_MULTIPLIER = 5;

    // Map widget =============================================================
    var Map = Widget.extend({
        init: function(element, options) {
            kendo.destroy(element);
            Widget.fn.init.call(this, element);

            this._initOptions(options);
            this.bind(this.events, options);

            this.crs = new EPSG3857();

            this.element
                .addClass(CSS_PREFIX + this.options.name.toLowerCase())
                .css("position", "relative")
                .empty()
                .append(doc.createElement("div"));

            this._viewOrigin = this._getOrigin();
            this._initScroller();
            this._initMarkers();
            this._initControls();
            this._initLayers();
            this._reset();

            this._mousewheel = proxy(this._mousewheel, this);
            this.element.bind("click", proxy(this._click, this));
            this.element.bind(MOUSEWHEEL, this._mousewheel);
        },

        options: {
            name: "Map",
            controls: {
                attribution: true,
                navigator: {
                    panStep: 100
                },
                zoom: true
            },
            layers: [],
            layerDefaults: {
                shape: {
                    style: {
                        fill: {
                            color: "#fff"
                        },
                        stroke: {
                            color: "#aaa",
                            width: 0.5
                        }
                    }
                }
            },
            center: [0, 0],
            zoom: 3,
            minSize: 256,
            minZoom: 1,
            maxZoom: 19,
            markers: [],
            markerDefaults: {
                shape: "pinTarget",
                tooltip: {
                    autoHide: false,
                    position: "top",
                    showOn: "click"
                }
            },
            wraparound: true
        },

        events:[
            "click",
            "reset",
            "pan",
            "panEnd",
            "markerCreated",
            "shapeClick",
            "shapeCreated",
            "shapeMouseEnter",
            "shapeMouseLeave",
            "zoomStart",
            "zoomEnd"
        ],

        destroy: function() {
            this.scroller.destroy();

            if (this.navigator) {
                this.navigator.destroy();
            }

            if (this.attribution) {
                this.attribution.destroy();
            }

            if (this.zoomControl) {
                this.zoomControl.destroy();
            }

            Widget.fn.destroy.call(this);
        },

        zoom: function(level) {
            var options = this.options;

            if (defined(level)) {
                level = limit(level, options.minZoom, options.maxZoom);
                if (options.zoom !== level) {
                    options.zoom = level;
                    this._reset();
                }

                return this;
            } else {
                return options.zoom;
            }
        },

        center: function(center) {
            if (center) {
                this.options.center = Location.create(center).toArray();
                this._reset();

                return this;
            } else {
                return Location.create(this.options.center);
            }
        },

        extent: function() {
            var nw = this._getOrigin();
            var bottomRight = this.locationToLayer(nw);
            var size = this.viewSize();

            bottomRight.x += size.width;
            bottomRight.y += size.height;

            var se = this.layerToLocation(bottomRight);
            return new Extent(nw, se);
        },

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);
            this._reset();
        },

        locationToLayer: function(location, zoom) {
            var clamp = !this.options.wraparound;
            location = Location.create(location);
            return this.crs.toPoint(location, this._layerSize(zoom), clamp);
        },

        layerToLocation: function(point, zoom) {
            var clamp = !this.options.wraparound;
            return  this.crs.toLocation(point, this._layerSize(zoom), clamp);
        },

        locationToView: function(location) {
            location = Location.create(location);
            var origin = this.locationToLayer(this._viewOrigin);
            var point = this.locationToLayer(location);

            return point.subtract(origin);
        },

        viewToLocation: function(point, zoom) {
            var origin = this.locationToLayer(this._getOrigin(), zoom);
            point = point.clone().add(origin);
            return this.layerToLocation(point, zoom);
        },

        eventOffset: function(e) {
            var offset = this.element.offset();
            var event = e.originalEvent || e;
            var x = valueOrDefault(event.pageX, event.clientX) - offset.left;
            var y = valueOrDefault(event.pageY, event.clientY) - offset.top;

            return new g.Point(x, y);
        },

        eventToView: function(e) {
            var cursor = this.eventOffset(e);
            return this.locationToView(this.viewToLocation(cursor));
        },

        eventToLayer: function(e) {
            return this.locationToLayer(this.eventToLocation(e));
        },

        eventToLocation: function(e) {
            var cursor = this.eventOffset(e);
            return this.viewToLocation(cursor);
        },

        viewSize: function() {
            var element = this.element;
            var scale = this._layerSize();
            var width = element.width();

            if (!this.options.wraparound) {
                width = min(scale, width);
            }
            return {
                width: width,
                height: min(scale, element.height())
            };
        },

        _setOrigin: function(origin, zoom) {
            var size = this.viewSize(),
                topLeft;

            origin = this._origin = Location.create(origin);
            topLeft = this.locationToLayer(origin, zoom);
            topLeft.x += size.width / 2;
            topLeft.y += size.height / 2;

            this.options.center = this.layerToLocation(topLeft, zoom).toArray();

            return this;
        },

        _getOrigin: function(invalidate) {
            var size = this.viewSize(),
                topLeft;

            if (invalidate || !this._origin) {
                topLeft = this.locationToLayer(this.center());
                topLeft.x -= size.width / 2;
                topLeft.y -= size.height / 2;

                this._origin = this.layerToLocation(topLeft);
            }

            return this._origin;
        },

        _zoomAround: function(pivot, level) {
            this._setOrigin(this.layerToLocation(pivot, level), level);
            this.zoom(level);
        },

        _initControls: function() {
            var controls = this.options.controls;

            if (Attribution && controls.attribution) {
                this._createAttribution(controls.attribution);
            }

            if (!kendo.support.mobileOS) {
                if (Navigator && controls.navigator) {
                    this._createNavigator(controls.navigator);
                }

                if (ZoomControl && controls.zoom) {
                    this._createZoomControl(controls.zoom);
                }
            }
        },

        _createControlElement: function(options, defaultPos) {
            var pos = options.position || defaultPos;
            var posSelector = "." + renderPos(pos).replace(" ", ".");
            var wrap = $(".k-map-controls" + posSelector, this.element);
            if (wrap.length === 0) {
                wrap = $("<div>")
                       .addClass("k-map-controls " + renderPos(pos))
                       .appendTo(this.element);
            }

            return $("<div>").appendTo(wrap);
        },

        _createAttribution: function(options) {
            var element = this._createControlElement(options, "bottomRight");
            this.attribution = new Attribution(element, options);
        },

        _createNavigator: function(options) {
            var element = this._createControlElement(options, "topLeft");
            var navigator = this.navigator = new Navigator(element, options);

            this._navigatorPan = proxy(this._navigatorPan, this);
            navigator.bind("pan", this._navigatorPan);

            this._navigatorCenter = proxy(this._navigatorCenter, this);
            navigator.bind("center", this._navigatorCenter);
        },

        _navigatorPan: function(e) {
            var map = this;
            var scroller = map.scroller;

            var x = scroller.scrollLeft + e.x;
            var y = scroller.scrollTop - e.y;

            var bounds = this._virtualSize;
            var height = this.element.height();
            var width = this.element.width();

            // TODO: Move limits in scroller
            x = limit(x, bounds.x.min, bounds.x.max - width);
            y = limit(y, bounds.y.min, bounds.y.max - height);

            map.scroller.one("scroll", function(e) { map._scrollEnd(e); });
            map.scroller.scrollTo(-x, -y);
        },

        _navigatorCenter: function() {
            this.center(this.options.center);
        },

        _createZoomControl: function(options) {
            var element = this._createControlElement(options, "topLeft");
            var zoomControl = this.zoomControl = new ZoomControl(element, options);

            this._zoomControlChange = proxy(this._zoomControlChange, this);
            zoomControl.bind("change", this._zoomControlChange);
        },

        _zoomControlChange: function(e) {
            if (!this.trigger("zoomStart", { originalEvent: e })) {
                this.zoom(this.zoom() + e.delta);
                this.trigger("zoomEnd", { originalEvent: e });
            }
        },

        _initScroller: function() {
            var friction = kendo.support.mobileOS ? FRICTION_MOBILE : FRICTION;
            var zoomable = this.options.zoomable !== false;
            var scroller = this.scroller = new kendo.mobile.ui.Scroller(
                this.element.children(0), {
                    friction: friction,
                    velocityMultiplier: VELOCITY_MULTIPLIER,
                    zoom: zoomable
                });

            scroller.bind("scroll", proxy(this._scroll, this));
            scroller.bind("scrollEnd", proxy(this._scrollEnd, this));
            scroller.userEvents.bind("gesturestart", proxy(this._scaleStart, this));
            scroller.userEvents.bind("gestureend", proxy(this._scale, this));

            this.scrollElement = scroller.scrollElement;
        },

        _initLayers: function() {
            var defs = this.options.layers,
                layers = this.layers = [];

            for (var i = 0; i < defs.length; i++) {
                var options = defs[i];
                var type = options.type || "shape";
                var defaults = this.options.layerDefaults[type];
                var impl = dataviz.map.layers[type];

                layers.push(new impl(this, deepExtend({}, defaults, options)));
            }
        },

        _initMarkers: function() {
            this.markers = new map.layers.MarkerLayer(this, {
                markerDefaults: this.options.markerDefaults
            });
            this.markers.add(this.options.markers);
        },

        _scroll: function(e) {
            var origin = this.locationToLayer(this._viewOrigin).round();
            var movable = e.sender.movable;

            var offset = new g.Point(movable.x, movable.y).multiply(-1).multiply(1/movable.scale);
            origin.x += offset.x;
            origin.y += offset.y;

            this._setOrigin(this.layerToLocation(origin));
            this.trigger("pan", {
                originalEvent: e,
                origin: this._getOrigin(),
                center: this.center()
            });
        },

        _scrollEnd: function(e) {
            this.trigger("panEnd", {
                originalEvent: e,
                origin: this._getOrigin(),
                center: this.center()
            });
        },

        _scaleStart: function(e) {
            if (this.trigger("zoomStart", { originalEvent: e })) {
                var touch = e.touches[1];
                if (touch) {
                    touch.cancel();
                }
            }
        },

        _scale: function(e) {
            var scale = this.scroller.movable.scale;
            var zoom = this._scaleToZoom(scale);
            var gestureCenter = new g.Point(e.center.x, e.center.y);
            var centerLocation = this.viewToLocation(gestureCenter, zoom);
            var centerPoint = this.locationToLayer(centerLocation, zoom);
            var originPoint = centerPoint.subtract(gestureCenter);

            this._zoomAround(originPoint, zoom);
            this.trigger("zoomEnd", { originalEvent: e });
        },

        _scaleToZoom: function(scaleDelta) {
            var scale = this._layerSize() * scaleDelta;
            var tiles = scale / this.options.minSize;
            var zoom = math.log(tiles) / math.log(2);

            return math.round(zoom);
        },

        _reset: function() {
            if (this.attribution) {
                this.attribution.filter(this.center(), this.zoom());
            }

            this._viewOrigin = this._getOrigin(true);
            this._resetScroller();
            this.trigger("reset");
        },

        _resetScroller: function() {
            var scroller = this.scroller;
            var x = scroller.dimensions.x;
            var y = scroller.dimensions.y;
            var scale = this._layerSize();
            var maxScale = 20 * scale;
            var nw = this.extent().nw;
            var topLeft = this.locationToLayer(nw).round();

            scroller.reset();
            scroller.userEvents.cancel();

            var maxZoom = this.options.maxZoom - this.zoom();
            scroller.dimensions.maxScale = pow(2, maxZoom);

            scroller.movable.round = true;

            var xBounds = { min: -topLeft.x, max: scale - topLeft.x };
            var yBounds = { min: -topLeft.y, max: scale - topLeft.y };

            if (this.options.wraparound) {
                xBounds.min = -maxScale;
                xBounds.max = maxScale;
            }

            if (this.options.pannable === false) {
                var viewSize = this.viewSize();
                xBounds.min = yBounds.min = 0;
                xBounds.max = viewSize.width;
                yBounds.max = viewSize.height;
            }

            x.makeVirtual();
            y.makeVirtual();
            x.virtualSize(xBounds.min, xBounds.max);
            y.virtualSize(yBounds.min, yBounds.max);

            this._virtualSize = { x: xBounds, y: yBounds };
        },

        _renderLayers: function() {
            var defs = this.options.layers,
                layers = this.layers = [],
                scrollWrap = this.scrollWrap;

            scrollWrap.empty();

            for (var i = 0; i < defs.length; i++) {
                var options = defs[i];
                var type = options.type || "shape";
                var defaults = this.options.layerDefaults[type];
                var impl = dataviz.map.layers[type];

                layers.push(new impl(this, deepExtend({}, defaults, options)));
            }
        },

        _layerSize: function(zoom) {
            zoom = valueOrDefault(zoom, this.options.zoom);
            return this.options.minSize * pow(2, zoom);
        },

        _click: function(e) {
            var cursor = this.eventOffset(e);
            this.trigger("click", {
                originalEvent: e,
                location: this.viewToLocation(cursor)
            });
        },

        _mousewheel: function(e) {
            e.preventDefault();
            var delta = dataviz.mwDelta(e) > 0 ? -1 : 1;
            var options = this.options;
            var fromZoom = this.zoom();
            var toZoom = limit(fromZoom + delta, options.minZoom, options.maxZoom);

            if (options.zoomable !== false && toZoom !== fromZoom) {
                if (!this.trigger("zoomStart", { originalEvent: e })) {
                    var cursor = this.eventOffset(e);
                    var location = this.viewToLocation(cursor);
                    var postZoom = this.locationToLayer(location, toZoom);
                    var origin = postZoom.subtract(cursor);
                    this._zoomAround(origin, toZoom);

                    this.trigger("zoomEnd", { originalEvent: e });
                }
            }
        }
    });

    // Exports ================================================================
    dataviz.ui.plugin(Map);

})(window.kendo.jQuery);
