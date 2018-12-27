import React, { Component } from 'react';
import Items from '../components/Items';
import { parse } from 'url';

const Home = props => (
  <div>
    <Items page={parseFloat(props.query.page) || 1} />
  </div>
);
export default Home;
