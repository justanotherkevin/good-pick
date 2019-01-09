import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';
import { fakeItem } from '../lib/testUtils';
import Router from 'next/router';

const dogImage = 'https:dogimage.com/dog.jpg';

// mock global fetch API
// return the expected json from fn uploadFile()
global.fetch = jest.fn().mockResolvedValue({
  json: () => ({
    secure_url: dogImage,
    eager: [{ secure_url: dogImage }]
  })
});

describe('<CreateItem/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot;
  });

  it('uploads a file; test uploadFile function ', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const input = wrapper.find('input[type="file"]');
    input.simulate('change', { target: { files: ['testdog.jpeg'] } });
    await wait();
    const component = wrapper.find('CreateItem').instance();
    expect(component.state.image).toEqual(dogImage);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    global.fetch.mockReset();
  });

  it('handle state update with on change: handleChange()', () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    // <input
    //   type="text"
    //   id="title"
    //   name="title"
    //   placeholder="Title"
    //   required
    //   value={this.state.title}
    //   onChange={this.handleChange}
    // />
    wrapper.find('#title').simulate('change', {
      target: { name: 'title', value: 'test name' }
    });
    wrapper.find('#price').simulate('change', {
      target: { name: 'price', value: 9000, type: 'number' }
    });
    wrapper.find('#description').simulate('change', {
      target: { name: 'description', value: 'This is test description' }
    });

    const component = wrapper.find('CreateItem').instance();
    expect(component.state).toMatchObject({
      title: 'test name',
      price: 9000,
      description: 'This is test description'
    });
  });

  it('creates an item when the form is submitted', async () => {
    const item = fakeItem();
    const mocks = [
      {
        request: {
          query: CREATE_ITEM_MUTATION,
          variables: {
            title: item.title,
            description: item.description,
            image: '',
            largeImage: '',
            price: item.price
          }
        },
        result: {
          data: {
            createItem: {
              ...fakeItem,
              id: 'abc123',
              __typename: 'Item'
            }
          }
        }
      }
    ];

    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );
    // simulate someone filling out the form
    wrapper
      .find('#title')
      .simulate('change', { target: { value: item.title, name: 'title' } });
    wrapper.find('#price').simulate('change', {
      target: { value: item.price, name: 'price', type: 'number' }
    });
    wrapper.find('#description').simulate('change', {
      target: { value: item.description, name: 'description' }
    });
    // mock the router
    Router.router = { push: jest.fn() };
    wrapper.find('form').simulate('submit');
    await wait(50);
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: '/item',
      query: { id: 'abc123' }
    });
  });
});
