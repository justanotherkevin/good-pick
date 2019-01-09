import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import RequestReset, {
  REQUEST_RESET_MUTATION
} from '../components/RequestReset';

const mocks = [
  {
    request: {
      query: REQUEST_RESET_MUTATION,
      variables: { email: 'test@test.test' }
    },
    result: {
      data: {
        requestReset: { message: 'success', __typename: 'message' }
      }
    }
  }
];

describe('<RequestReset/> component test', () => {
  it('renders and matches snapshot', () => {
    const wrapper = mount(
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );
    const form = wrapper.find('form');
    expect(toJSON(form)).toMatchSnapshot();
    // console.log(form.debug());
  });

  it('calls the mutations', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );
    // simulate input change
    wrapper.find('input').simulate('change', {
      target: {
        name: 'email',
        value: 'test@test.test'
      }
    });
    // simulate form submit
    wrapper.find('form').simulate('submit');
    await wait(5);
    wrapper.update();
    const targetMessage = wrapper.find('p');
    expect(targetMessage.text()).toBe(
      'Success! Check your email for a reset link!'
    );
  });
});
