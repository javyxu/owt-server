/*global require, module*/
'use strict';

var RtspIn = require('./rtspIn/build/Release/rtspIn');
var logger = require('./logger').logger;

// Logger
var log = logger.getLogger('RtspIn');

module.exports = function () {
    var that = {},
        audio = false,
        video = false,
        rtspClient;

    /*
     * Given a WebRtcConnection waits for the state CANDIDATES_GATHERED for set remote SDP.
     */
    var initRtspClient = function (rtspClient, on_status) {
        var audio_codec_list = [],
            video_codec_list = [],
            video_resolution;

        rtspClient.init(function (msg) {
          log.info('RtspIn Addon status:' + msg);

          if (msg.startsWith('videoCodec')) {
              video_codec_list.push(msg.split(':')[1]);
          } else if (msg.startsWith('audioCodec')) {
              audio_codec_list.push(msg.split(':')[1]);
          } else if (msg.startsWith('videoResolution')) {
              video_resolution = msg.split(':')[1];
          } else if (msg === 'success') {
              on_status({type: 'ready', audio_codecs: audio_codec_list, video_codecs: video_codec_list, video_resolution: video_resolution});
          } else {
              on_status({type: 'failed', reason: msg});
          }
        });

        on_status({type: 'initializing'});
    };


    that.init = function (url, expect_audio, expect_video, transport, buffer_size, on_status) {
        audio = expect_audio;
        video = expect_video;
        rtspClient = new RtspIn(url, audio, video, transport, buffer_size);

        initRtspClient(rtspClient, on_status);
    };

    that.close = function () {
        rtspClient.close();
    };

    that.addDestination = function (track, dest) {
        if (audio && track === 'audio') {
            rtspClient.addDestination('audio', dest);
            return;
        } else if (video && track === 'video') {
            rtspClient.addDestination('video', dest);
            return;
        } else {
            log.warn('Wrong track:'+track);
        }
    };

    that.removeDestination = function (track, dest) {
        if (audio && track === 'audio') {
            rtspClient.removeDestination('audio', dest);
            return;
        } else if (video && track === 'video') {
            rtspClient.removeDestination('video', dest);
            return;
        }
        log.warn('Wrong track:'+track);
    };

    return that;
};