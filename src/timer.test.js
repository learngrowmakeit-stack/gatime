import test from 'node:test';
import assert from 'node:assert/strict';
import {durationMs,remainingMs,timerText} from './timer.js';
test('timer validates whole minutes/seconds and rejects blank, zero and out-of-range input',()=>{assert.equal(durationMs('5','30'),330000);for(const pair of [['','0'],['0','0'],['1','60'],['-1','0'],['1.2','0'],['1441','0']])assert.equal(durationMs(...pair),null);});
test('deadline catches up after suspended callbacks and paused time stays fixed',()=>{const running={status:'running',deadline:10000,remaining:5000};assert.equal(remainingMs(running,7000),3000);assert.equal(remainingMs(running,15000),0);assert.equal(remainingMs({status:'paused',remaining:3000},15000),3000);assert.equal(timerText(1001),'00:02');assert.equal(timerText(60000),'01:00');});
