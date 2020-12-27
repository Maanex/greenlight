import * as mongo from 'mongodb'
import { config } from '../index'
import MongoAdapter from './mongo-adapter'


export default class Database {

  public static client: mongo.MongoClient;

  //

  public static init() {
    Database.client = MongoAdapter.client
  }

  public static get(name: string): mongo.Db | null {
    return this.client ? this.client.db(name) : null
  }

  public static collection(collection: string): mongo.Collection | null {
    return this.client ? this.client.db(config.mongodb.dbname).collection(collection) : null
  }

}
