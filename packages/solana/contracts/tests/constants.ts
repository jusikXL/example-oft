import { 
    PublicKey, 
} from '@solana/web3.js';
import { addressToBytes32, Options } from '@layerzerolabs/lz-v2-utilities';
import { EXECUTOR_CONFIG_SEED, DVN_CONFIG_SEED } from '@layerzerolabs/lz-solana-sdk-v2';
import "@layerzerolabs/lz-evm-sdk-v2";

import { EVMPeerConfig, EVMRateLimitConfig, SolanaPeerConfig, SolanaRateLimitConfig } from './utils';
import MainnetConfig from '../../../layerzero.config';
import TestnetConfig from '../../../mock.layerzero.config';
import { EndpointId } from '@layerzerolabs/lz-definitions';

import { getDeploymentAddressAndAbi } from '@layerzerolabs/lz-evm-sdk-v2'

const lzDVN = new PublicKey("HtEYV4xB4wvsj5fgTkcfuChYpvGYzgzwvNhgDZQNh7wW");
const lzDVNConfigAccount = PublicKey.findProgramAddressSync([Buffer.from(DVN_CONFIG_SEED, 'utf8')], lzDVN)[0];
const nethermindDVN = new PublicKey("4fs6aL12L18K5giDy9Dgxgrb3aNRYiuRV2a7JPPj3e7F");
const nethermindDVNConfigAccount = PublicKey.findProgramAddressSync([Buffer.from(DVN_CONFIG_SEED, 'utf8')], nethermindDVN)[0];
const uln = new PublicKey("7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH");
const executor = new PublicKey("6doghB248px58JSSwG4qejQ46kFMW4AMj7vzJnWZHNZn");

const lzDVNAddress = getDeploymentAddressAndAbi('arbitrum-mainnet', 'DVN').address
const nethermindDVNAddress = getDeploymentAddressAndAbi('arbitrum-mainnet', 'DVNNethermind').address

export const EVMRateLimits: EVMRateLimitConfig = {
    rateLimitConfig: ({
        rateLimitCapacity: BigInt(10000000000000000000000),
        window: BigInt(86400),
    })
}

export const solanaRateLimits: SolanaRateLimitConfig = {
    rateLimitConfig: ({
        rateLimitCapacity: BigInt(10000000000),
        rateLimitRefillRatePerSecond: BigInt(115741),
    })
}

const solanaToArbitrumConfig: SolanaPeerConfig = {
    to: MainnetConfig.contracts[0].contract, 
    peerAddress: addressToBytes32("0xfb047fF2c376e22522d2a7809ad1eD38459ad2B8"),
    // Based on token decimals, e.g., 6 decimal tokens will set 10000000000 for a capacity of 10000 tokens (6 decimals)s
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const arbitrumToSolanaConfig: EVMPeerConfig = {
    from: MainnetConfig.contracts[0].contract,
    dstEid: EndpointId.SOLANA_V2_MAINNET,
    sendLibrary: getDeploymentAddressAndAbi('arbitrum-mainnet', 'SendUln302').address,
    receiveLibraryConfig: ({
        receiveLibrary: getDeploymentAddressAndAbi('arbitrum-mainnet', 'ReceiveUln302').address,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: getDeploymentAddressAndAbi('arbitrum-mainnet', 'Executor').address,
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const solanaToBaseConfig: SolanaPeerConfig = { // Base Sepolia Config
    to: MainnetConfig.contracts[1].contract, 
    peerAddress: addressToBytes32('0xfb047fF2c376e22522d2a7809ad1eD38459ad2B8'),
    // Based on token decimals, e.g., 6 decimal tokens will set 100000000 for a capacity of 100 tokens (6 decimals)
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const baseToSolanaConfig: EVMPeerConfig = {
    from: MainnetConfig.contracts[0].contract,
    dstEid: EndpointId.SOLANA_V2_MAINNET,
    sendLibrary: getDeploymentAddressAndAbi('base-mainnet', 'SendUln302').address,
    receiveLibraryConfig: ({
        receiveLibrary: getDeploymentAddressAndAbi('base-mainnet', 'ReceiveUln302').address,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: getDeploymentAddressAndAbi('base-mainnet', 'Executor').address,
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const solanaToBlastConfig: SolanaPeerConfig = {
    // Arbitrum Sepolia Config
    to: MainnetConfig.contracts[2].contract, 
    peerAddress: addressToBytes32('0xfb047fF2c376e22522d2a7809ad1eD38459ad2B8'),
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    // Based on token decimals, e.g., 6 decimal tokens will set 10000000000 for a capacity of 10000 tokens (6 decimals)
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const blastToSolanaConfig: EVMPeerConfig = {
    from: MainnetConfig.contracts[0].contract,
    dstEid: EndpointId.SOLANA_V2_MAINNET,
    sendLibrary: getDeploymentAddressAndAbi('blast-mainnet', 'SendUln302').address,
    receiveLibraryConfig: ({
        receiveLibrary: getDeploymentAddressAndAbi('blast-mainnet', 'ReceiveUln302').address,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: getDeploymentAddressAndAbi('blast-mainnet', 'Executor').address,
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const solanaToEthereumConfig: SolanaPeerConfig = { // EThereum Sepolia Config
    to: MainnetConfig.contracts[3].contract, 
    peerAddress: addressToBytes32('0xfb047fF2c376e22522d2a7809ad1eD38459ad2B8'),
    // Based on token decimals, e.g., 6 decimal tokens will set 100000000 for a capacity of 100 tokens (6 decimals)
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const ethereumToSolanaConfig: EVMPeerConfig = {
    from: MainnetConfig.contracts[0].contract,
    dstEid: EndpointId.SOLANA_V2_MAINNET,
    sendLibrary: getDeploymentAddressAndAbi('ethereum-mainnet', 'SendUln302').address,
    receiveLibraryConfig: ({
        receiveLibrary: getDeploymentAddressAndAbi('ethereum-mainnet', 'ReceiveUln302').address,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: getDeploymentAddressAndAbi('ethereum-mainnet', 'Executor').address,
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const solanaToOptimismConfig: SolanaPeerConfig = {
    // Arbitrum Sepolia Config
    to: MainnetConfig.contracts[4].contract, 
    peerAddress: addressToBytes32('0xfb047fF2c376e22522d2a7809ad1eD38459ad2B8'),
    // Based on token decimals, e.g., 6 decimal tokens will set 10000000000 for a capacity of 10000 tokens (6 decimals)
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const optimismToSolanaConfig: EVMPeerConfig = {
    from: MainnetConfig.contracts[0].contract,
    dstEid: EndpointId.SOLANA_V2_MAINNET,
    sendLibrary: getDeploymentAddressAndAbi('optimism-mainnet', 'SendUln302').address,
    receiveLibraryConfig: ({
        receiveLibrary: getDeploymentAddressAndAbi('optimism-mainnet', 'ReceiveUln302').address,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: getDeploymentAddressAndAbi('optimism-mainnet', 'Executor').address,
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const solanaToTronConfig: SolanaPeerConfig = {
    // Arbitrum Sepolia Config
    to: MainnetConfig.contracts[5].contract,
    peerAddress: addressToBytes32('0xfb047fF2c376e22522d2a7809ad1eD38459ad2B8'),
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    // Based on token decimals, e.g., 6 decimal tokens will set 10000000000 for a capacity of 10000 tokens (6 decimals)
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount, nethermindDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const tronToSolanaConfig: EVMPeerConfig = {
    from: MainnetConfig.contracts[0].contract,
    dstEid: EndpointId.SOLANA_V2_MAINNET,
    sendLibrary: getDeploymentAddressAndAbi('tron-mainnet', 'SendUln302').address,
    receiveLibraryConfig: ({
        receiveLibrary: getDeploymentAddressAndAbi('tron-mainnet', 'ReceiveUln302').address,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 2,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNAddress, nethermindDVNAddress],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: getDeploymentAddressAndAbi('tron-mainnet', 'Executor').address,
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

// Add any new mainnet connection configurations above and export in the array below.
export const solanaToEvmMainnetConnections: Array<SolanaPeerConfig> = [
    solanaToArbitrumConfig,
    solanaToBaseConfig,
    solanaToBlastConfig,
    solanaToEthereumConfig,
    solanaToOptimismConfig,
    solanaToTronConfig
]

export const evmToSolanaMainnetConnections: Array<EVMPeerConfig> = [
    arbitrumToSolanaConfig,
    baseToSolanaConfig,
    blastToSolanaConfig,
    ethereumToSolanaConfig,
    optimismToSolanaConfig,
    tronToSolanaConfig
]

const solanaToArbSepConfig: SolanaPeerConfig = {
    // Arbitrum Sepolia Config
    to: TestnetConfig.contracts[0].contract,
    peerAddress: addressToBytes32('0x259115ef998c6712e54f3f33467596Ea6679EA77'),
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    // Based on token decimals, e.g., 6 decimal tokens will set 10000000000 for a capacity of 10000 tokens (6 decimals)
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 1,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 1,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const arbsepToSolanaConfig: EVMPeerConfig = {
    from: TestnetConfig.contracts[0].contract,
    dstEid: EndpointId.SOLANA_V2_TESTNET,
    sendLibrary: getDeploymentAddressAndAbi('arbsep-testnet', 'SendUln302').address,
    receiveLibraryConfig: ({
        receiveLibrary: getDeploymentAddressAndAbi('arbsep-testnet', 'ReceiveUln302').address,
        gracePeriod: BigInt(0)
    }),
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 1,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [getDeploymentAddressAndAbi('arbsep-testnet', 'DVN').address],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 1,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [getDeploymentAddressAndAbi('arbsep-testnet', 'DVN').address],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: getDeploymentAddressAndAbi('arbsep-testnet', 'Executor').address,
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

const solanaToEthSepConfig: SolanaPeerConfig = {
    // Arbitrum Sepolia Config
    to: TestnetConfig.contracts[1].contract,
    peerAddress: addressToBytes32('0xEB6671c152C88E76fdAaBC804Bf973e3270f4c78'),
    sendLibrary: uln,
    receiveLibraryConfig: ({
        receiveLibrary: uln,
        gracePeriod: BigInt(0)
    }),
    // Based on token decimals, e.g., 6 decimal tokens will set 10000000000 for a capacity of 10000 tokens (6 decimals)
    sendUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 1,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount],
        optionalDvns: [],
    }),
    receiveUlnConfig: ({
        confirmations: 100,
        requiredDvnCount: 1,
        optionalDvnCount: 0,
        optionalDvnThreshold: 0,
        requiredDvns: [lzDVNConfigAccount],
        optionalDvns: [],
    }),
    executorConfig: ({
        executor: PublicKey.findProgramAddressSync([Buffer.from(EXECUTOR_CONFIG_SEED, 'utf8')], executor)[0],
        maxMessageSize: 10000,
    }),
    sendOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(),
    sendAndCallOptions: Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(),
}

// Add any new testnet connection configurations above and export in the array below.
export const solanaToEvmTestnetConnections: Array<SolanaPeerConfig> = [
    solanaToArbSepConfig,
]

export const evmToSolanaTestnetConnections: Array<EVMPeerConfig> = [
    arbsepToSolanaConfig,
]