// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var realTimeSpeech_pb = require('./realTimeSpeech_pb.js');

function serialize_clova_speech_AudioRequest(arg) {
  if (!(arg instanceof realTimeSpeech_pb.AudioRequest)) {
    throw new Error('Expected argument of type clova.speech.AudioRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_clova_speech_AudioRequest(buffer_arg) {
  return realTimeSpeech_pb.AudioRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_clova_speech_AudioResponse(arg) {
  if (!(arg instanceof realTimeSpeech_pb.AudioResponse)) {
    throw new Error('Expected argument of type clova.speech.AudioResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_clova_speech_AudioResponse(buffer_arg) {
  return realTimeSpeech_pb.AudioResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// 실시간 음성 인식을 위한 서비스 정의
var SpeechServiceService = exports.SpeechServiceService = {
  // 실시간 음성 스트리밍 처리
realTimeStreaming: {
    path: '/clova.speech.SpeechService/RealTimeStreaming',
    requestStream: true,
    responseStream: true,
    requestType: realTimeSpeech_pb.AudioRequest,
    responseType: realTimeSpeech_pb.AudioResponse,
    requestSerialize: serialize_clova_speech_AudioRequest,
    requestDeserialize: deserialize_clova_speech_AudioRequest,
    responseSerialize: serialize_clova_speech_AudioResponse,
    responseDeserialize: deserialize_clova_speech_AudioResponse,
  },
};

exports.SpeechServiceClient = grpc.makeGenericClientConstructor(SpeechServiceService);
