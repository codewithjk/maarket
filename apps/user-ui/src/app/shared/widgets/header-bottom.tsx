"use client";

import CartIcon from 'apps/user-ui/src/assets/svgs/cart-icon';
import HeartIcon from 'apps/user-ui/src/assets/svgs/heart-icon';
import ProfileIcon from 'apps/user-ui/src/assets/svgs/profile-icon';
import { navItems } from 'apps/user-ui/src/configs/constants';
import useUser from 'apps/user-ui/src/hooks/useUser';
import { AlignLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

function HeaderBottom() {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { user, isLoading } = useUser();
  

  // Track scroll position to toggle sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);



  return (
    <div
      className={`w-full transition-all duration-300  ${isSticky ? 'fixed top-0 left-0 z-[100] bg-white shadow-lg' : 'relative'} border-b`}
    >
      <div className={` w-[80%] relative m-auto flex items-center justify-between ${isSticky ? "pt-3" : "py-0"}`}>
        {/* All dropdowns */}
        <div className={`w-[260px] ${isSticky && "-mb-2"} cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3486ff]`}
          onClick={() => setShow(!show)}>
          <div className="flex items-center gap-2">
            <AlignLeft color='white' />
            <span className='text-white font-medium '>All Department</span>


          </div>
           <ChevronDown color='white'/>
        </div>
        {/* Dropdown Menu */}

        {show && (
        <div className={`absolute left-0 ${isSticky ? "top-[70px]" : "top-[50px]"} h-[400px] bg-[#f5f5f5] `}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex gap-8">
            <div>
              <h4 className="font-bold mb-2">Categories</h4>
              <ul className="space-y-1">
                <li><a href="#" className="hover:underline">Electronics</a></li>
                <li><a href="#" className="hover:underline">Fashion</a></li>
                <li><a href="#" className="hover:underline">Home & Garden</a></li>
                <li><a href="#" className="hover:underline">Toys</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">Brands</h4>
              <ul className="space-y-1">
                <li><a href="#" className="hover:underline">Apple</a></li>
                <li><a href="#" className="hover:underline">Nike</a></li>
                <li><a href="#" className="hover:underline">Samsung</a></li>
                <li><a href="#" className="hover:underline">Sony</a></li>
              </ul>
            </div>
          </div>
        </div>
        )}
        {/* Navigation links */}
        <div className="flex items-center">
          {navItems.map((item: NavItemsType, index: number) => (
            <Link key={index} className=' px-5 font-medium text-lg ' href={item.href}>{item.title}</Link>
          ))}

        </div>

        {/* show login and cart wishlist when scroll */}
        <div>
          {isSticky && (
              <div className="flex items-center gap-8 pb-2 ">
          <div className="flex items-center gap-2">
            {!isLoading && user ? (
              <>
              <Link href={"/profile"}  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1C1a]">
                 <ProfileIcon className="w-full h-full" />
              </Link>
              <Link href={"/profile"}>
                  <span className="block font-medium">Hello,</span>
                  <span className="font-semibold">{user?.name?.split(" ")[0] }</span>
                </Link>
                </>
            ) : (
              <>
                <Link
                  href={"/login"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1C1a]"
                >
                  <ProfileIcon className="w-full h-full" />
                </Link>

                <Link href={"/login"}>
                  <span className="block font-medium">Hello,</span>
                    <span className="font-semibold">{ isLoading ? "...": "Sigh In"}</span>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <Link href={"/wishlist"} className=" relative">
              <HeartIcon className="w-full h-full" />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm ">0</span>
              </div>
            </Link>
            <Link href={"/wishlist"} className=" relative">
              <CartIcon className="w-full h-full" />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm ">0</span>
              </div>
            </Link>
          </div>
        </div>
          )}
        </div>
        
      </div>

      
    </div>
  );
}

export default HeaderBottom