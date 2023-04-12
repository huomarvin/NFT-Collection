import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected记录用户的钱包是否已连接
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted记录预售是否已开始
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded记录预售是否已结束
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading在我们等待交易被挖掘时设置为true
  const [loading, setLoading] = useState(false);
  // 检验当前连接的MetaMask钱包是否是合约的所有者
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted跟踪已经被铸造的tokenId的数量
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // 创建一个Web3 Modal的引用（用于连接到Metamask），只要页面打开就会持续存在
  const web3ModalRef = useRef();

  /**
   * 在预售开始时铸造一个NFT
   */
  const presaleMint = async () => {
    try {
      // 获取一个Signer，因为这是一个“写”交易
      const signer = await getProviderOrSigner(true);
      // 创建一个新的合约实例，这个实例有一个Signer，这样就可以调用更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // 调用合约中的presaleMint方法，只有白名单地址才能铸造
      const tx = await nftContract.presaleMint({
        // value表示一个Crypto Dev的成本，这个成本是“0.01”eth。
        // 我们使用ethers.js的utils库将“0.01”字符串解析为ether
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // 等待交易被挖掘
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 在预售结束后铸造一个NFT
   */
  const publicMint = async () => {
    try {
      // 我们需要一个Signer，因为这是一个“写”交易
      const signer = await getProviderOrSigner(true);
      // 创建一个新的合约实例，这个实例有一个Signer，这样就可以调用更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // 调用合约中的mint方法，铸造一个Crypto Dev
      const tx = await nftContract.mint({
        // value表示一个Crypto Dev的成本，这个成本是“0.01”eth。
        // 我们使用ethers.js的utils库将“0.01”字符串解析为ether
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // 等待交易被挖掘
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /*
      连接MetaMask钱包
    */
  const connectWallet = async () => {
    try {
      // 获取web3Modal的提供者，这里我们使用的是MetaMask
      // 当第一次使用时，它会提示用户连接他们的钱包
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 开启预售
   */
  const startPresale = async () => {
    try {
      // 获取一个Signer，因为这是一个“写”交易
      const signer = await getProviderOrSigner(true);
      // 创建一个新的合约实例，这个实例有一个Signer，这样就可以调用更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // 调用合约中的startPresale方法
      const tx = await nftContract.startPresale();
      setLoading(true);
      // 等待交易被挖掘
      await tx.wait();
      setLoading(false);
      // 设置预售已开始
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 检查预售是否已开始
   */
  const checkIfPresaleStarted = async () => {
    try {
      // 获取web3Modal的提供者，这里我们使用的是MetaMask
      // 这里不需要Signer，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 我们使用提供者连接到合约，所以我们只能对合约进行只读访问
      // 创建一个新的合约实例，这个实例有一个Provider，这样就可以调用只读方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 调用合约中的presaleStarted方法
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * 检查预售是否已结束
   */
  const checkIfPresaleEnded = async () => {
    try {
      // 获取web3Modal的提供者，这里我们使用的是MetaMask
      // 这里不需要Signer，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 创建一个新的合约实例，这个实例有一个Provider，这样就可以调用只读方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 获取合约中的presaleEnded方法
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded是一个Big Number，所以我们使用lt（小于函数）而不是“<”
      // Date.now（）/ 1000返回当前时间（以秒为单位）
      // 我们比较_presaleEnded时间戳是否小于当前时间
      // 这意味着预售已结束
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * getOwner：调用合约以检索所有者
   */
  const getOwner = async () => {
    try {
      // 获取web3Modal的提供者，这里我们使用的是MetaMask
      // 这里不需要Signer，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 创建一个新的合约实例，这个实例有一个Provider，这样就可以调用只读方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 调用合约中的owner方法
      const _owner = await nftContract.owner();
      // 我们现在会得到一个Signer，以提取当前连接的MetaMask帐户的地址
      const signer = await getProviderOrSigner(true);
      // 获取与连接到MetaMask的Signer相关联的地址
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * 获取tokenIdsMinted：获取已经被铸造的tokenIds的数量
   */
  const getTokenIdsMinted = async () => {
    try {
      // 获取web3Modal的提供者，这里我们使用的是MetaMask
      // 这里不需要Signer，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 创建一个新的合约实例，这个实例有一个Provider，这样就可以调用只读方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 调用合约中的tokenIds方法
      const _tokenIds = await nftContract.tokenIds();
      // _tokenIds是一个Big Number。我们需要将Big Number转换为字符串
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 返回一个提供者或签名者对象，该对象表示具有或不具有Metamask附加的签名功能的以太坊RPC
   * Provider是需要与区块链交互的对象 - 读取交易，读取余额，读取状态等。
   * Signer是一个特殊类型的Provider，用于在需要将交易发送到区块链的情况下进行写入操作，这涉及到连接的帐户需要使用签名函数对交易进行数字签名以授权发送交易。
   * @param {*} needSigner - 如果需要签名者，则为true，否则为false
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // 连接到MetaMask
    // 由于我们将`web3Modal`存储为引用，因此我们需要访问`current`值才能访问底层对象
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // 如果用户没有连接到Goerli网络，请让他们知道并抛出错误
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects被用来响应网站状态的变化
  // 函数调用的末尾的数组表示什么状态变化会触发这个效果
  // 在这种情况下，每当`walletConnected`的值发生变化时，就会调用这个效果
  useEffect(() => {
    // 如果钱包没有连接，创建一个新的Web3Modal实例并连接MetaMask钱包
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // 判断预售是否已经开始和结束
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // 如果预售已经结束，清除这个interval
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // 每5秒获取tokenIdsMinted的数量
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /*
      返回一个按钮，这个按钮基于dapp的状态
    */
  const renderButton = () => {
    // 如果钱包没有连接，返回一个按钮，允许他们连接钱包
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // 如果连接的用户是所有者，并且预售尚未开始，则允许他们启动预售
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // 如果连接的用户不是所有者，但预售尚未开始，则告诉他们
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasn&#39;t started!</div>
        </div>
      );
    }

    // 如果预售已经开始，但尚未结束，则允许在预售期间进行挖矿
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // 如果预售已经开始并且已经结束，那么就是公共挖矿的时候了
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            It&#39;s an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
