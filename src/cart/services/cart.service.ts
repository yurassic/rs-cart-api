import { Injectable } from '@nestjs/common';
import { Client } from 'pg';
import { v4 } from 'uuid';

import { Cart } from '../models';

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;

const dbOptions = {
  host: PG_HOST,
  port: Number(PG_PORT),
  database: PG_DATABASE,
  user: PG_USERNAME,
  password: PG_PASSWORD,
  connectionTimeoutMillis: 5000,
};
@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};

  findByUserId(userId: string): Cart {
    return this.userCarts[ userId ];
  }

  createByUserId(userId: string) {
    const id = v4(v4());
    const userCart = {
      id,
      items: [],
    };

    this.userCarts[ userId ] = userCart;

    return userCart;
  }

  findOrCreateByUserId(userId: string): Cart {
    const userCart = this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async getCart(cartId: string): Promise<Cart> {
    const client = new Client(dbOptions);
    try {
      await client.connect();
    } catch (error){
      console.error(error)
    }

    try {
      // SEE: Accidentally I call my bd and service name as card instead of cart
      const { rows: [cart] } = await client.query(`select * from cards where id = '${cartId}'`);
      const { rows: cart_items } = await client.query(`select * from card_items where card_id = '${cartId}'`);

      return {
        ...cart,
        cart_items,
      }
    } catch (error) {
      console.error(error)
      return {} as Cart;
    }
    finally {
      await client.end();
    }
  }

  updateByUserId(userId: string, { items }: Cart): Cart {
    const { id, ...rest } = this.findOrCreateByUserId(userId);

    const updatedCart = {
      id,
      ...rest,
      items: [ ...items ],
    }

    this.userCarts[ userId ] = { ...updatedCart };

    return { ...updatedCart };
  }

  removeByUserId(userId): void {
    this.userCarts[ userId ] = null;
  }

}
