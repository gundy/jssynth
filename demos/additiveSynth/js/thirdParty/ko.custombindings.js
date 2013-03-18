
(function() {
    "use strict";

    ko.bindingHandlers.spinner = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().spinnerOptions || {};
            $(element).spinner(options);

            //handle the field changing
            $(element).on("spinchange", function(event, ui) {
                valueAccessor()($(element).spinner("value"));
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).spinner("destroy");
            });

        },
        update: function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());

            var current = $(element).spinner("value");
            if (value !== current) {
                $(element).spinner("value", value);
            }
        }
    };

    ko.bindingHandlers.slider = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var options = allBindingsAccessor().sliderOptions || {};
            $(element).slider(options);
            ko.utils.registerEventHandler(element, "slidechange", function (event, ui) {
                var observable = valueAccessor();
                observable(ui.value);
            });
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).slider("destroy");
            });
            ko.utils.registerEventHandler(element, "slide", function (event, ui) {
                var observable = valueAccessor();
                observable(ui.value);
            });
        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            if (isNaN(value)) value = 0;
            $(element).slider("value", value);
        }
    };


})();
