import React, { Component } from 'react';
import { Query } from 'react-apollo';
import Error from './ErrorMessage';
import styled from 'styled-components';
import Head from 'next/head';
import { SINGLE_ITEM_QUERY } from '../gql/query';

const SingleItemStyles = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  box-shadow: ${props => props.theme.bs};
  display: grid;
  grid-template-columns: 1fr;
  /* grid-auto-flow: column; */
  min-height: 800px;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 2rem;
  }
  .details {
    margin: 3rem;
    font-size: 2rem;
  }
  @media only screen and ( min-width: ${prop => prop.theme.mediaScreenMedium} ) {
    max-width: ${props => props.theme.maxWidth};
    grid-template-columns: 1fr 1fr;
  }
`;


class SingleItem extends Component {
  render() {
    const itemObj = { id: this.props.id };
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={itemObj}>
        {apolloRes => {
          const { error, loading, data } = apolloRes;
          if (error) return <Error error={error} />;
          if (loading) return <p>Loading...</p>;
          // client side resolver if no item found.
          if (!data.item) return <p>No Item Found for {this.props.id}</p>;

          const item = data.item;
          return (
            <SingleItemStyles>
              {/* moddify head, title to the name of the item; sideeffect with next.js*/}
              <Head>
                <title>Good Shop | {item.title}</title>
              </Head>
              <img src={item.largeImage} alt={item.title} />
              <div className="details">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </SingleItemStyles>
          );
        }}
      </Query>
    );
  }
}
export default SingleItem;
