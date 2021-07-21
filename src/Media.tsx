import React from 'reactn';
import { Flex } from '@adobe/react-spectrum';
import { Card } from 'Card';

export const Media: React.FC = () => {
  return (
    <Flex direction="row" gap="size-200" wrap>
      <Card Title="Title.mp4" Type="movie"></Card>
      <Card Title="Credit.mp4" Type="movie"></Card>
      <Card Title="BGM1.wav" Type="audio"></Card>
    </Flex>
  );
};
