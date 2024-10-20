# PodX Frontend

PodX is an on-chain video conferencing platform that allows users to connect and tip meeting participants using cryptocurrency.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Contains the main application pages and layouts
- `components/`: Reusable React components
- `lib/`: Utility functions and configurations
- `providers/`: React context providers
- `store/`: Redux store setup and slices
- `public/`: Static assets

## Key Features

- Real-time video and audio meetings
- Participant management
- On-chain tipping functionality with cryptocurrency
- User authentication with Privy
- Responsive design for various screen sizes

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Stream Video SDK for real-time communication
- Privy for Web3 authentication
- Ethers.js and Wagmi for blockchain interactions
- Coinbase OnchainKit
- Radix UI components
- Socket.io for real-time communication

## Dependencies

Key dependencies include:

- @coinbase/onchainkit: ^0.33.6
- @privy-io/react-auth: ^1.88.4
- @stream-io/video-react-sdk: ^1.6.5
- @tanstack/react-query: ^5.59.15
- ethers: ^6.13.4
- next: 14.2.14
- react: ^18
- react-redux: ^9.1.2
- viem: ^2.17.11
- wagmi: ^2.12.20

For a full list of dependencies, please refer to the `package.json` file.

## Environment Variables

Make sure to set up the following environment variables:

- `NEXT_PUBLIC_PRIVY_APP_ID`: Your Privy application ID
- `NEXT_PUBLIC_STREAM_KEY`: Your Stream API key

## Scripts

- `dev`: Run the development server
- `build`: Build the production application
- `start`: Start the production server
- `lint`: Run ESLint

## Deployment

This project is set up to be easily deployed on Vercel. For other hosting platforms, make sure to configure the build settings according to Next.js requirements.

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stream Video React SDK](https://getstream.io/video/docs/react/)
- [Privy Documentation](https://docs.privy.io/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.