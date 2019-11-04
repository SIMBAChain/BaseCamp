import Vue from 'vue'
import Router from 'vue-router'

import Parts from '@/components/Parts'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Parts',
      component: Parts
    }
  ]
})