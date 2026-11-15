declare module "stripe" {
  class Stripe {
    constructor(key: string, config?: { apiVersion?: string });
    webhooks: {
      constructEvent(
        payload: string | Buffer,
        signature: string | undefined,
        secret: string
      ): Stripe.Event;
    };
    subscriptions: {
      retrieve(id: string): Promise<Stripe.Subscription>;
    };
    checkout: {
      sessions: {
        create(params: any): Promise<Stripe.Checkout.Session>;
      };
    };
    billingPortal: {
      sessions: {
        create(params: any): Promise<Stripe.BillingPortal.Session>;
      };
    };
  }
  namespace Stripe {
    export interface Event {
      id: string;
      type: string;
      data: { object: any };
    }
    export interface Subscription {
      id: string;
      status: string;
      current_period_end: number;
      customer: string;
    }
    export namespace Checkout {
      export interface Session {
        id: string;
        customer: string;
        subscription: string;
        url?: string;
      }
    }
    export namespace BillingPortal {
      export interface Session {
        id: string;
        url: string;
      }
    }
    export interface Invoice {
      id: string;
      status: string;
      customer: string;
    }
  }
  export default Stripe;
}