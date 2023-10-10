import { Route } from "../structure/app/app.ts";

export const router = new Route();

import { router as subscriptions } from "./api/subscriptions.ts";
import { router as transactions } from "./api/transactions.ts";
import { router as types } from "./api/types.ts";
import { router as buckets } from "./api/buckets.ts";
import { router as balanceCorrection } from "./api/balance-correction.ts";
import { router as miles } from "./api/miles.ts";

router.route('/subscriptions', subscriptions);
router.route('/transactions', transactions);
router.route('/types', types);
router.route('/buckets', buckets);
router.route('/balance-correction', balanceCorrection);
router.route('/miles', miles);