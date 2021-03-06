// # Local File System Image Storage module
// The (default) module for storing images, using the local file system

var express    = require('express'),
    util       = require('util'),
    Promise    = require('bluebird'),
    cloudinary = require('cloudinary'),
    errors     = require('../errors'),
    config     = require('../config'),
    utils      = require('../utils'),
    baseStore  = require('./base'),
    http       = require('http'),
    url        = require('url');

cloudinary.config({
    cloud_name: config.storage.credentials.cloud_name,
    api_key: config.storage.credentials.api_key,
    api_secret: config.storage.credentials.api_secret
});

function CloudinaryFileStore() {
}
util.inherits(CloudinaryFileStore, baseStore);

// ### Save
// Saves the image to cloudinary
// - image is the express image object
// - returns a promise which ultimately returns the full url to the uploaded image
CloudinaryFileStore.prototype.save = function (image) {
    return cloudinary.uploader.upload(image.path).then(function (result) {
        return result.url;
    })
    .catch(function (e) {
        errors.logError(e);
        return Promise.reject(e);
    });
};

// local-file-store.exists is used to generate unique names
// in this store, unique names are generated by Cloudinary
// method issues a head request to determine if a file already exists
CloudinaryFileStore.prototype.exists = function (imagePath) {
    return new Promise(function (resolve) {
        var _url = url.parse(imagePath);
        try {
            http.request({method: 'HEAD', host: _url.host, path: _url.path}, function (res) {
                // 20X etc
                if (res.statusCode.toString().indexOf('2') === 0) {
                    resolve(true);
                // 40X
                } else {
                    resolve(false);
                }
            });
        }
        catch (e) {
            errors.logError(e);
            resolve(false);
        }
    });
};

// middleware for serving the files
CloudinaryFileStore.prototype.serve = function () {
    // For some reason send divides the max age number by 1000
    return express['static'](config.paths.imagesPath, {maxAge: utils.ONE_YEAR_MS});
};

module.exports = CloudinaryFileStore;
