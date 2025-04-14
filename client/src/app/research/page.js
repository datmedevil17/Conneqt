"use client"

import { useEffect, useState } from "react";
import { Calendar, Coins, FileText } from 'lucide-react';
import Navbar from "../components/Navbar";
import { useReadContract, useWriteContract } from "wagmi";
import { startResearchCrowdfundingConfig } from "@/contract/function";
import { parseEther } from "viem";
import { toast } from "sonner";
import { escrowABI, escrowAddress } from "@/contract/contract";

const Page = () => {
    const [showModal, setShowModal] = useState(false);
    const { writeContractAsync } = useWriteContract();
    const [researchData, setResearchData] = useState([]);

    const [newResearch, setNewResearch] = useState({
        title: '',
        description: '',
        amount: '',
        deadline: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewResearch({ ...newResearch, [name]: value });
    };

    // Fetch total number of research projects
    const { data: totalProjects,isLoading: totalLoading } = useReadContract({
        abi: escrowABI,
        address: escrowAddress,
        functionName: "nextProjectId",
    });

    // Fetch research project details
    useEffect(() => {
        console.log('Total Projects:', totalProjects);  
        const fetchResearchProjects = async () => {
            if (totalProjects) {
                const projects = [];
                for (let i = 0; i < totalProjects; i++) {
                    const project = await useReadContract({
                        abi: escrowABI,
                        address: escrowAddress,
                        functionName: "getResearchProject",
                        args: [i],
                    });
                    console.log('Project:', project);
                    projects.push({
                        title: project.title,
                        description: project.description,
                        amount: `${parseFloat(project.amount) / 1e18} ETH`,
                        deadline: new Date(project.deadline * 1000).toLocaleDateString(),
                    });
                }

                console.log('Fetched research projects:', projects);
                setResearchData(projects);
            }
        };

        fetchResearchProjects();
    }, [totalProjects,totalLoading]);

    const handleCreateResearch = async () => {
        try {
            const amountInWei = parseEther(newResearch.amount.replace(' ETH', ''));
            const deadlineDate = new Date(newResearch.deadline);
            const currentDate = new Date();
            const durationInSeconds = Math.floor((deadlineDate - currentDate) / 1000);

            if (durationInSeconds <= 0) {
                alert('Deadline must be in the future');
                return;
            }

            await writeContractAsync({
                ...startResearchCrowdfundingConfig,
                args: [
                    newResearch.title,
                    amountInWei,
                    durationInSeconds
                ]
            });

            toast.success('Research created successfully!');
            setNewResearch({
                title: '',
                description: '',
                amount: '',
                deadline: ''
            });
            setShowModal(false);
        } catch (error) {
            console.error('Error creating research:', error);
            alert('Error creating research. Please try again.');
        }
    };

    return (
        <div className="p-6 mt-20 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Research Projects
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                >
                    <FileText className="w-5 h-5" />
                    Create Research
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {researchData.map((research, index) => (
                    <div
                        key={index}
                        className="bg-gray-800/50 p-6 rounded-xl shadow-xl border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                    >
                        <h2 className="text-xl font-semibold text-purple-400 mb-3">
                            {research.title}
                        </h2>
                        <p className="text-gray-300 mb-4 line-clamp-3">
                            {research.description}
                        </p>
                        <div className="flex items-center gap-2 text-purple-400 font-bold">
                            <Coins className="w-5 h-5" />
                            <span>Funding Required: {research.amount}</span>
                        </div>
                        <div className="text-gray-400 text-sm mt-2">
                            Deadline: {research.deadline}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md border border-purple-400/30">
                        <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                            <FileText className="w-6 h-6" />
                            Create Research
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={newResearch.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter research title"
                                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                                <textarea
                                    name="description"
                                    value={newResearch.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter research description"
                                    rows="4"
                                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Funding Amount</label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="amount"
                                        value={newResearch.amount}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 10 ETH"
                                        className="w-full p-3 pl-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Deadline</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={newResearch.deadline}
                                        onChange={handleInputChange}
                                        className="w-full p-3 pl-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-8 gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateResearch}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Page;
