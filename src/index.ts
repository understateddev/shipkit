#!/usr/bin/env node
import 'dotenv/config';
import { cli } from '~/cli';

(async () => {
  await cli();
})();
