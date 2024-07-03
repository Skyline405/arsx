/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from "rxjs"

export class NetworkStream<T = any> extends Observable<T> {}
