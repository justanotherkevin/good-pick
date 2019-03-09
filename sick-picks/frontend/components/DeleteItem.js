import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { ALL_ITEMS_QUERY } from '../gql/query';
import { DELETE_ITEM_MUTATION } from '../gql/mutation';

class DeleteItem extends Component {
  // manually update the cache on the client, so it matches the server
  update = (cache, payload) => {
    // 1. Read the cache for the items we want
    // 2. Filter the deleted item out of cache
    // 3. Rewrite the cache
    const data = cache.readQuery({ query: ALL_ITEMS_QUERY });
    console.log(data)
    data.items = data.items.filter(
      item => item.id !== payload.data.deleteItem.id
    );
    cache.writeQuery({ query: ALL_ITEMS_QUERY, data });
  };
  render() {
    return (
      <Mutation
        mutation={DELETE_ITEM_MUTATION}
        variables={{ id: this.props.id }}
        update={this.update}
      >
        {(deleteItem, { error }) => (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this item?')) {
                deleteItem().catch(err => {
                  alert(err.message);
                });
              }
            }}
          >
            {this.props.children}
          </button>
        )}
      </Mutation>
    );
  }
}

export default DeleteItem;
