const Footer = () => {
  return (
    <footer className="w-full py-[54px]">
      <div className="container mx-auto">
        <div className="w-full flex justify-between items-center">
          <p>Podx @ {new Date().getFullYear()}</p>

          <div>socials</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
