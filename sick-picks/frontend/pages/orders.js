import OrderList from '../components/OrderList';
import PleaseSignIn from '../components/PleaseSignIn';
import { Component } from 'react';

const OrderPage = props => (
  <div>
    <PleaseSignIn>
      <OrderList />
    </PleaseSignIn>
  </div>
);

export default OrderPage;

