export enum SerializationFormat {
  /**
   * Stable Optimized non portable C/C++ format. Used by croaring. Can be smaller than the portable format.
   */
  croaring = "croaring",

  /**
   * Stable Portable Java and Go format.
   */
  portable = "portable",

  /**
   * Non portable C/C++ frozen format.
   * Is considered unsafe and unstable because the format might change at any new version.
   * Can be useful for temporary storage or for sending data over the network between similar machines.
   * If the content is corrupted when deserialized or when a frozen view is create, the behavior is undefined!
   * The application may crash, buffer overrun, could be a vector of attack!
   *
   * When this option is used in the serialize function, the new returned buffer (if no buffer was provided) will be aligned to a 32 bytes boundary.
   * This is required to create a frozen view with the method unsafeFrozenView.
   *
   */
  unsafe_frozen_croaring = "unsafe_frozen_croaring",

  /**
   * A plain binary array of 32 bits integers in little endian format. 4 bytes per value.
   */
  uint32_array = "uint32_array",
}

export type SerializationFormatType =
  | SerializationFormat
  | "croaring"
  | "portable"
  | "unsafe_frozen_croaring"
  | "uint32_array"
  | boolean;

export enum DeserializationFormat {
  /** Stable Optimized non portable C/C++ format. Used by croaring. Can be smaller than the portable format. */
  croaring = "croaring",

  /** Stable Portable Java and Go format. */
  portable = "portable",

  /**
   * Non portable C/C++ frozen format.
   * Is considered unsafe and unstable because the format might change at any new version.
   * Can be useful for temporary storage or for sending data over the network between similar machines.
   * If the content is corrupted when loaded or the buffer is modified when a frozen view is create, the behavior is undefined!
   * The application may crash, buffer overrun, could be a vector of attack!
   */
  unsafe_frozen_croaring = "unsafe_frozen_croaring",

  /**
   * Portable version of the frozen view, compatible with Go and Java.
   * Is considered unsafe and unstable because the format might change at any new version.
   * Can be useful for temporary storage or for sending data over the network between similar machines.
   * If the content is corrupted when loaded or the buffer is modified when a frozen view is create, the behavior is undefined!
   * The application may crash, buffer overrun, could be a vector of attack!
   */
  unsafe_frozen_portable = "unsafe_frozen_portable",

  /**
   * A plain binary array of 32 bits integers in little endian format. 4 bytes per value.
   */
  uint32_array = "uint32_array",
}

export type DeserializationFormatType =
  | DeserializationFormat
  | "croaring"
  | "portable"
  | "unsafe_frozen_croaring"
  | "unsafe_frozen_portable"
  | "uint32_array"
  | boolean;

export type SerializationDeserializationFormatType = SerializationFormatType & DeserializationFormatType;

export type SerializationDeserializationFormat = SerializationDeserializationFormatType;
