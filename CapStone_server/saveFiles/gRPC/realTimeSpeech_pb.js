// source: realTimeSpeech.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() {
  if (this) { return this; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  if (typeof self !== 'undefined') { return self; }
  return Function('return this')();
}.call(null));

goog.exportSymbol('proto.clova.speech.AudioRequest', null, global);
goog.exportSymbol('proto.clova.speech.AudioResponse', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.clova.speech.AudioRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.clova.speech.AudioRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.clova.speech.AudioRequest.displayName = 'proto.clova.speech.AudioRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.clova.speech.AudioResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.clova.speech.AudioResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.clova.speech.AudioResponse.displayName = 'proto.clova.speech.AudioResponse';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.clova.speech.AudioRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.clova.speech.AudioRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.clova.speech.AudioRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.clova.speech.AudioRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    audioData: msg.getAudioData_asB64(),
    config: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.clova.speech.AudioRequest}
 */
proto.clova.speech.AudioRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.clova.speech.AudioRequest;
  return proto.clova.speech.AudioRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.clova.speech.AudioRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.clova.speech.AudioRequest}
 */
proto.clova.speech.AudioRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAudioData(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setConfig(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.clova.speech.AudioRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.clova.speech.AudioRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.clova.speech.AudioRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.clova.speech.AudioRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAudioData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getConfig();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional bytes audio_data = 1;
 * @return {!(string|Uint8Array)}
 */
proto.clova.speech.AudioRequest.prototype.getAudioData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes audio_data = 1;
 * This is a type-conversion wrapper around `getAudioData()`
 * @return {string}
 */
proto.clova.speech.AudioRequest.prototype.getAudioData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAudioData()));
};


/**
 * optional bytes audio_data = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAudioData()`
 * @return {!Uint8Array}
 */
proto.clova.speech.AudioRequest.prototype.getAudioData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAudioData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.clova.speech.AudioRequest} returns this
 */
proto.clova.speech.AudioRequest.prototype.setAudioData = function(value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional string config = 2;
 * @return {string}
 */
proto.clova.speech.AudioRequest.prototype.getConfig = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.clova.speech.AudioRequest} returns this
 */
proto.clova.speech.AudioRequest.prototype.setConfig = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.clova.speech.AudioResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.clova.speech.AudioResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.clova.speech.AudioResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.clova.speech.AudioResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    transcript: jspb.Message.getFieldWithDefault(msg, 1, ""),
    isFinal: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.clova.speech.AudioResponse}
 */
proto.clova.speech.AudioResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.clova.speech.AudioResponse;
  return proto.clova.speech.AudioResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.clova.speech.AudioResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.clova.speech.AudioResponse}
 */
proto.clova.speech.AudioResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTranscript(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsFinal(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.clova.speech.AudioResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.clova.speech.AudioResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.clova.speech.AudioResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.clova.speech.AudioResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTranscript();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getIsFinal();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional string transcript = 1;
 * @return {string}
 */
proto.clova.speech.AudioResponse.prototype.getTranscript = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.clova.speech.AudioResponse} returns this
 */
proto.clova.speech.AudioResponse.prototype.setTranscript = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bool is_final = 2;
 * @return {boolean}
 */
proto.clova.speech.AudioResponse.prototype.getIsFinal = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.clova.speech.AudioResponse} returns this
 */
proto.clova.speech.AudioResponse.prototype.setIsFinal = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


goog.object.extend(exports, proto.clova.speech);
