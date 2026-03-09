import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-b from-saas-black to-[#1c160c] overflow-hidden min-h-[90vh] flex items-center">
      {/* Orange glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-saas-orange opacity-10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-orange-700 opacity-15 rounded-full blur-[80px]"></div>
      <div className="absolute top-20 right-1/4 w-[250px] h-[250px] bg-orange-400 opacity-10 rounded-full blur-[70px]"></div>
      
      <div className="section-container relative z-10 text-center">
        <div className="flex flex-col items-center justify-center max-w-4xl mx-auto">
          <div className="animate-fade-in">
            <span className="inline-block bg-saas-orange/10 text-saas-orange px-4 py-2 rounded-full text-sm font-medium mb-6 border border-saas-orange/20">
              Introducing Sassland 2.0
            </span>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              Transform Your Business With Our <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">SaaS Solution</span>
            </h1>
            
            <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
              Streamline your operations, boost productivity, and enhance customer satisfaction with our cutting-edge SaaS platform. Experience seamless integration and unparalleled support.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-saas-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-saas-orange text-saas-orange hover:bg-saas-orange hover:text-white">
                Book Demo
              </Button>
            </div>
            
            <div className="mt-10 flex items-center justify-center gap-4">
              <div className="flex -space-x-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" 
                  className="w-10 h-10 rounded-full border-2 border-saas-black" alt="User" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" 
                  className="w-10 h-10 rounded-full border-2 border-saas-black" alt="User" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" 
                  className="w-10 h-10 rounded-full border-2 border-saas-black" alt="User" />
              </div>
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-saas-orange">500+</span> businesses already using our platform
              </p>
            </div>
          </div>
          
          <div className="mt-16 animate-fade-in" style={{animationDelay: '0.5s'}}>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-saas-orange to-orange-700 blur-xl opacity-20 rounded-xl"></div>
              <div className="relative bg-saas-darkGray rounded-xl border border-saas-orange/20 p-2 card-shadow transform transition-all duration-500 hover:scale-[1.01] hover:shadow-orange-500/10 hover:shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&w=1200&h=600&q=80"
                  alt="Dashboard Preview"
                  className="rounded-lg w-full"
                />
                <div className="absolute bottom-4 left-4 bg-saas-orange/80 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm font-medium">
                  Modern Dashboard Interface
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Abstract shapes */}
      <div className="absolute bottom-10 left-10 w-20 h-20 border border-saas-orange/20 rounded-full"></div>
      <div className="absolute top-20 right-10 w-10 h-10 border border-saas-orange/20 rounded-full"></div>
      <div className="absolute top-40 left-20 w-5 h-5 bg-saas-orange/20 rounded-full"></div>
    </div>
  );
};

export default HeroSection;
