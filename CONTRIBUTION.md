# Contribution Guidelines

Excited by our work and want to get involved in building out our extension releases? Or maybe you haven't learned as much about the EOS protocol but are a savvy developer? 

You can explore our [Current Projects](https://github.com/KoinEx/pulse) in-the works for our different releases. Feel free to fork our repo and start creating PR’s after assigning yourself to an issue of interest. We are always chatting on [Discord](https://discord.gg/zHymkdB)  drop us a line there if you want to get more involved or have any questions on our implementation!

## Contribution Steps

**1. Set up Pulse following the instructions in README.md.**

**2. Fork the Pulse repo.**

Sign in to your Github account or create a new account if you do not have one already. Then navigate your browser to https://github.com/KoinEx/pulse . In the upper right hand corner of the page, click “fork”. This will create a copy of the Pulse repo in your account.

**3. Create a local clone of Pulse.**

```
$ git clone https://github.com/KoinEx/pulse.git
```

**4. Link your local clone to the fork on your Github repo.**

```
$ git remote add mypulserepo https://github.com/<your_github_user_name>/pulse.git
```

**5. Link your local clone to the  repo so that you can easily fetch future changes to the  Pulse repo.**

```
$ git remote add pulse https://github.com/KoinEx/pulse.git
$ git remote -v (you should see pulse and mypulserepo in the list of remotes)
```

**6. Find an issue to work on.**

Check out open issues at https://github.com/KoinEx/pulse/issues and pick one. Leave a comment to let the development team know that you would like to work on it. Or examine the code for areas that can be improved and leave a comment to the development team to ask if they would like you to work on it.

**7. Create a local branch with a name that clearly identifies what you will be working on.**

```
$ git checkout -b feature-in-progress-branch
```

**8. Make improvements to the code.**

Each time you work on the code be sure that you are working on the branch that you have created as opposed to your local copy of the  Koinex Pulse repo. Keeping your changes segregated in this branch will make it easier to merge your changes into the repo later.

```
$ git checkout feature-in-progress-branch
```

**9. Test your changes.**

Changes that only affect a single file can be tested with


**10. Stage the file or files that you want to commit.**

```
$ git add --all
```

This command stages all of the files that you have changed. You can add individual files by specifying the file name or names and eliminating the “-- all”.

**11. Commit the file or files.**

```
$ git commit  -m “Message to explain what the commit covers”
```

You can use the –amend flag to include previous commits that have not yet been pushed to an upstream repo to the current commit.

**12. Rebase your branch atop of the latest version of Pulse.**

```
$ git rebase pulse/master
```

If there are conflicts between your edits and those made by others since you started work Git will ask you to resolve them. To find out which files have conflicts run ...

```
$ git status
```

Open those files one at a time and you
will see lines inserted by Git that identify the conflicts:

```
<<<<<< HEAD
Other developers’ version of the conflicting code
======
Your version of the conflicting code
'>>>>> Your Commit
```

The code from the Pulse repo is inserted between <<< and === while the change you have made is inserted between === and >>>>. Remove everything between <<<< and >>> and replace it with code that resolves the conflict. Repeat the process for all files listed by git status that have conflicts.

**14. Push your changes to your fork of the Pulse repo.**

Rebasing a pull request changes the history on your branch, so Git will reject a normal git push after a rebase. Use a force push to move your changes to your fork of the repo.

```
$ git push mypulserepo feature-in-progress-branch -f
```

**15. Check to be sure your fork of the Pulse repo contains your feature branch with the latest edits.**

Navigate to your fork of the repo on Github. On the upper left where the current branch is listed, change the branch to your feature-in-progress-branch. Open the files that you have worked on and check to make sure they include your changes.

**16. Create a pull request.**

Navigate your browser to https://github.com/KoinEx/pulse and click on the new pull request button. In the “base” box on the left, leave the default selection “base master”, the branch that you want your changes to be applied to. In the “compare” box on the right, select feature-in-progress-branch, the branch containing the changes you want to apply. You will then be asked to answer a few questions about your pull request. After you complete the questionnaire, the pull request will appear in the list of pull requests at https://github.com/KoinEx/pulse/pulls.

**17. Respond to comments by Core Contributors.**

Core Contributors may ask questions and request that you make edits. If you set notifications at the top of the page to “not watching,” you will still be notified by email whenever someone comments on the page of a pull request you have created. If you are asked to modify your pull request, repeat steps 8 through 15, then leave a comment to notify the Core Contributors that the pull request is ready for further review.1

We love working with people that are autonomous, bring independent thoughts to the team, and are excited for their work! We believe in a merit-based approach to becoming a core contributor, and any part-time contributor that puts in the time, work, and drive can become a core member of our team.
