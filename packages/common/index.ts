export interface SignupIncomingMessage {
  ip: string;
  publicKey: string;
  signedMessage: string;
  callbackId: string;
}

export interface ValidateIncomingMessage {
  callbackId: string;
  signedMessage: string;
  status: "Good" | "Bad";
  latency: number;
  websiteId: string;
  validatorId: string;
}

export interface SignupOutgoingMessage {
  validatorId: string;
  callbackId: string;
}

export interface ValidateOutgoingMessage {
  url: string;
  callbackId: string;
  websiteId: string;
}

export type IncomingMessage =
  | {
      type: "signup";
      data: SignupIncomingMessage;
    }
  | {
      type: "validate";
      data: ValidateIncomingMessage;
    };

export type OutgoingMessage =
  | {
      type: "signup";
      data: SignupOutgoingMessage;
    }
  | {
      type: "validate";
      data: ValidateOutgoingMessage;
    };
